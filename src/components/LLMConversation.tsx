import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface RAGConfig {
  indexName: string;
  topK: number;
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
  });
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
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
    setInput("");
    setLoading(true);

    try {
      // Simulated RAG response - in production this would:
      // 1. Search embeddings in Redis using vector similarity
      // 2. Retrieve top-k chunks
      // 3. Build prompt with context
      // 4. Send to LLM API
      // 5. Stream response back

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStreaming(true);

      const assistantId = crypto.randomUUID();
      let responseText = "";
      const chunks = [
        "Based on the retrieved documents,",
        " I found relevant information about the query.",
        " Redis vector search allows you to find semantically similar",
        " content using mathematical vector representations.",
      ];

      for (let i = 0; i < chunks.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        responseText += chunks[i] + " ";
        setMessages((prev) => {
          const existing = prev.find((m) => m.id === assistantId);
          if (existing) {
            return prev.map((m) => (m.id === assistantId ? { ...m, content: responseText } : m));
          } else {
            return [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content: chunks[0],
                timestamp: new Date(),
              },
            ];
          }
        });
      }

      setStreaming(false);
    } catch (error) {
      console.error("Chat failed:", error);
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
                  <Label>LLM Model</Label>
                  <select className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3">Claude 3</option>
                    <option value="local">Local (Ollama)</option>
                  </select>
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
