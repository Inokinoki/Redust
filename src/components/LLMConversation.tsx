import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useConnectionStore } from "../stores/connectionStore";
import * as api from "../lib/api";
import type { LLMModel, LLMProvider, RAGSource } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: RAGSource[];
}

interface RAGConfig {
  indexName: string;
  topK: number;
  model: LLMModel;
  provider: LLMProvider;
  apiKey?: string;
  apiEndpoint?: string;
}

interface LLMConversationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LLMConversation({ isOpen, onClose }: LLMConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [ragConfig, setRagConfig] = useState<RAGConfig>({
    indexName: "",
    topK: 5,
    model: "gpt-4-turbo",
    provider: "OpenAI",
    apiKey: "",
    apiEndpoint: "",
  });
  const [vectorField, setVectorField] = useState("embedding");
  const [loading, setLoading] = useState(false);
  const streaming = false;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current && typeof endRef.current.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || streaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const connection = useConnectionStore.getState().getActiveConnection();
      if (!connection) {
        throw new Error("No active Redis connection");
      }

      if (!ragConfig.indexName) {
        throw new Error("Please specify a vector index name");
      }

      // Build conversation history
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call RAG API
      const response = await api.llmRAG(connection, {
        query: currentInput,
        model: ragConfig.model,
        index_name: ragConfig.indexName,
        vector_field: vectorField,
        top_k: ragConfig.topK,
        temperature: 0.7,
        max_tokens: 2048,
        api_key: ragConfig.apiKey || undefined,
        api_endpoint: ragConfig.apiEndpoint || undefined,
        conversation_history: history,
      });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("RAG chat failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Error: " + String(error),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 flex h-[700px] w-full max-w-5xl rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <div className="flex w-full gap-4">
          <div className="flex w-2/3 flex-col">
            <h2 className="mb-4 text-xl font-semibold">RAG Configuration</h2>

            <Card>
              <CardHeader>
                <CardTitle>Retrieval Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="indexName">Vector Index</Label>
                  <Input
                    id="indexName"
                    placeholder="e.g., documents_index"
                    value={ragConfig.indexName}
                    onChange={(e) => setRagConfig({ ...ragConfig, indexName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topK">Top-K Chunks</Label>
                  <Input
                    id="topK"
                    type="number"
                    min={1}
                    max={20}
                    value={ragConfig.topK}
                    onChange={(e) => setRagConfig({ ...ragConfig, topK: parseInt(e.target.value) })}
                  />
                  <p className="mt-1 text-xs text-zinc-400">Number of context chunks to retrieve</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="llmProvider">LLM Provider</Label>
                  <select
                    id="llmProvider"
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                    value={ragConfig.provider}
                    onChange={(e) =>
                      setRagConfig({
                        ...ragConfig,
                        provider: e.target.value as LLMProvider,
                        model:
                          e.target.value === "OpenAI"
                            ? "gpt-4-turbo"
                            : e.target.value === "Anthropic"
                            ? "claude-3-sonnet"
                            : "llama2",
                      })
                    }
                  >
                    <option value="OpenAI">OpenAI</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="Ollama">Ollama (Local)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <select
                    id="model"
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                    value={ragConfig.model}
                    onChange={(e) => setRagConfig({ ...ragConfig, model: e.target.value as LLMModel })}
                  >
                    {ragConfig.provider === "OpenAI" && (
                      <>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </>
                    )}
                    {ragConfig.provider === "Anthropic" && (
                      <>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                      </>
                    )}
                    {ragConfig.provider === "Ollama" && (
                      <>
                        <option value="llama2">Llama 2</option>
                        <option value="mistral">Mistral</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key (optional)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={ragConfig.apiKey}
                    onChange={(e) => setRagConfig({ ...ragConfig, apiKey: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-zinc-400">
                    Leave empty to use environment variables or local models
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vectorField">Vector Field Name</Label>
                  <Input
                    id="vectorField"
                    placeholder="embedding"
                    value={vectorField}
                    onChange={(e) => setVectorField(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex w-1/3 flex-col">
            <h2 className="mb-2 text-xl font-semibold">AI Chat</h2>
            <div className="flex flex-1 flex-col overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex-1 space-y-4 overflow-auto">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-zinc-400">
                    <p>Start a conversation with Redis RAG</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-red-600 text-white"
                            : "bg-zinc-800 text-zinc-50"
                        }`}
                      >
                        <div className="mb-1 text-xs font-medium opacity-70">
                          {message.role === "user" ? "You" : "AI Assistant"}
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 border-t border-zinc-700 pt-2">
                            <div className="mb-1 text-xs font-medium text-zinc-400">
                              Sources:
                            </div>
                            {message.sources.slice(0, 3).map((source, i) => (
                              <div
                                key={i}
                                className="mb-1 rounded bg-zinc-900/50 p-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-zinc-400">
                                    {source.key.slice(0, 30)}
                                    {source.key.length > 30 ? "..." : ""}
                                  </span>
                                  <span className="text-red-400">
                                    {(source.score * 100).toFixed(1)}%
                                  </span>
                                </div>
                                {source.snippet && (
                                  <div className="mt-1 text-zinc-400">
                                    {source.snippet}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-1 text-xs text-zinc-400">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={endRef} />
              </div>

              <div className="mt-4 border-t border-zinc-800 pt-4">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
                    placeholder="Ask about your Redis data..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={loading || !input.trim()}>
                    {loading ? "..." : "Send"}
                  </Button>
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  {messages.length > 0 && "RAG enabled with " + ragConfig.topK + " context chunks"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
