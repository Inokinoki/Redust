import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useConnectionStore } from "../stores/connectionStore";
import * as api from "../lib/api";
import type { LLMModel, LLMProvider } from "../lib/api";

interface QueryOptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  improvements: string[];
  indexingSuggestions: string[];
  performanceTips: string[];
  estimatedImprovement: string;
  explanation: string;
}

interface QueryAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function QueryOptimizer({ isOpen, onClose, initialQuery = "" }: QueryAnalyzerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [queryType, setQueryType] = useState<"redis" | "sql" | "generic">("redis");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryOptimizationResult | null>(null);

  const [llmModel, setLlmModel] = useState<LLMModel>("gpt-4-turbo");
  const [llmProvider, setLlmProvider] = useState<LLMProvider>("OpenAI");
  const [apiKey, setApiKey] = useState("");

  const activeConnection = useConnectionStore((s) => s.currentConnection);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const analyzeQuery = async () => {
    if (!query.trim()) {
      setError("Please enter a query to analyze");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const prompt = `Analyze and optimize this ${queryType} query for Redis:

Original Query: ${query}

Provide a comprehensive analysis including:
1. Optimized version of the query
2. Specific improvements made
3. Indexing strategies (if applicable)
4. Performance tips
5. Estimated performance improvement
6. Clear explanation of changes

Format your response as follows:
OPTIMIZED_QUERY: [optimized query here]
IMPROVEMENTS: [list of improvements]
INDEXING: [indexing suggestions]
PERFORMANCE_TIPS: [performance tips]
ESTIMATED_IMPROVEMENT: [estimated improvement]
EXPLANATION: [detailed explanation]`;

      const response = await api.llmChat({
        model: llmModel,
        messages: [
          {
            role: "system",
            content:
              "You are an expert database query optimizer specializing in Redis and NoSQL databases.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        api_key: apiKey || undefined,
      });

      // Parse the response
      const parsedResult = parseOptimizationResponse(response.content, query);
      setResult(parsedResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const parseOptimizationResponse = (response: string, originalQuery: string): QueryOptimizationResult => {
    let optimizedQuery = originalQuery;
    const improvements: string[] = [];
    const indexingSuggestions: string[] = [];
    const performanceTips: string[] = [];
    let estimatedImprovement = "Moderate";
    let explanation = "";

    const lines = response.split("\n");
    let currentSection = "";

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("OPTIMIZED_QUERY:")) {
        optimizedQuery = trimmed.replace("OPTIMIZED_QUERY:", "").trim();
      } else if (trimmed.startsWith("IMPROVEMENTS:")) {
        currentSection = "improvements";
      } else if (trimmed.startsWith("INDEXING:")) {
        currentSection = "indexing";
      } else if (trimmed.startsWith("PERFORMANCE_TIPS:")) {
        currentSection = "tips";
      } else if (trimmed.startsWith("ESTIMATED_IMPROVEMENT:")) {
        estimatedImprovement = trimmed.replace("ESTIMATED_IMPROVEMENT:", "").trim();
      } else if (trimmed.startsWith("EXPLANATION:")) {
        currentSection = "explanation";
      } else if (trimmed && !trimmed.startsWith("#")) {
        const content = trimmed.replace(/^[-*•]\s*/, "").trim();

        switch (currentSection) {
          case "improvements":
            if (content) improvements.push(content);
            break;
          case "indexing":
            if (content) indexingSuggestions.push(content);
            break;
          case "tips":
            if (content) performanceTips.push(content);
            break;
          case "explanation":
            explanation += content + " ";
            break;
        }
      }
    });

    // If parsing failed, provide defaults
    if (improvements.length === 0) {
      improvements.push("Query structure analyzed");
      improvements.push("Optimization suggestions provided");
    }

    if (indexingSuggestions.length === 0) {
      indexingSuggestions.push("Consider indexing frequently queried fields");
      indexingSuggestions.push("Use appropriate data structures for your use case");
    }

    if (performanceTips.length === 0) {
      performanceTips.push("Use pipelining for multiple commands");
      performanceTips.push("Consider connection pooling");
      performanceTips.push("Monitor slow queries with Redis SLOWLOG");
    }

    return {
      originalQuery,
      optimizedQuery,
      improvements,
      indexingSuggestions,
      performanceTips,
      estimatedImprovement,
      explanation: explanation || "Query optimized based on Redis best practices.",
    };
  };

  const getQuickOptimizations = (): string[] => {
    const optimizations: string[] = [];

    // Check for common Redis query patterns
    if (query.toUpperCase().includes("KEYS ")) {
      optimizations.push("Replace KEYS with SCAN for better performance in production");
    }

    if (query.includes("*")) {
      optimizations.push("Consider using specific key patterns instead of wildcards");
    }

    if (query.match(/GET\s+\w+/)) {
      optimizations.push("Consider using MGET for multiple key retrieval");
    }

    if (query.includes("LRANGE")) {
      optimizations.push("Use LRANGE with limiting for large lists");
    }

    if (query.includes("HGETALL")) {
      optimizations.push("Consider using HGET/HMGET for specific fields instead of HGETALL");
    }

    // Check for missing pipeline opportunities
    const commandCount = (query.match(/[A-Z]+/g) || []).length;
    if (commandCount > 3) {
      optimizations.push("Consider using pipelining for multiple commands");
    }

    return optimizations;
  };

  if (!isOpen) return null;

  const quickOptimizations = getQuickOptimizations();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 w-full max-w-5xl h-[85vh] rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">AI Query Optimizer</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={analyzeQuery} disabled={analyzing || !query.trim()}>
              {analyzing ? "Analyzing..." : "Optimize Query"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="input">Input Query</TabsTrigger>
            <TabsTrigger value="results" disabled={!result}>
              Results ({result ? "1" : "0"})
            </TabsTrigger>
            <TabsTrigger value="quick">Quick Tips</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Query Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Query Type</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={queryType === "redis" ? "default" : "outline"}
                      onClick={() => setQueryType("redis")}
                      className="flex-1"
                    >
                      Redis
                    </Button>
                    <Button
                      variant={queryType === "sql" ? "default" : "outline"}
                      onClick={() => setQueryType("sql")}
                      className="flex-1"
                    >
                      SQL
                    </Button>
                    <Button
                      variant={queryType === "generic" ? "default" : "outline"}
                      onClick={() => setQueryType("generic")}
                      className="flex-1"
                    >
                      Generic
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="query">Query</Label>
                  <textarea
                    id="query"
                    className="flex min-h-[200px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                    placeholder="Enter your Redis query here..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={analyzing}
                  />
                </div>

                {error && (
                  <div className="rounded-md border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {quickOptimizations.length > 0 && (
                  <div className="rounded-md border border-blue-800 bg-blue-900/20 p-3">
                    <div className="text-sm font-medium text-blue-400 mb-2">Quick Optimizations Detected:</div>
                    <ul className="space-y-1">
                      {quickOptimizations.map((opt, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-2">
                          <span>•</span>
                          <span>{opt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {result && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Optimized Query</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Original Query</h4>
                        <pre className="bg-zinc-900 p-3 rounded-lg text-sm overflow-x-auto">
                          <code>{result.originalQuery}</code>
                        </pre>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Optimized Query</h4>
                        <pre className="bg-green-900/20 p-3 rounded-lg text-sm overflow-x-auto border border-green-800">
                          <code>{result.optimizedQuery}</code>
                        </pre>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400">Estimated Improvement:</span>
                        <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-sm font-medium">
                          {result.estimatedImprovement}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Improvements Made</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.improvements.map((improvement, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="flex-shrink-0 text-green-400">✓</span>
                          <span className="text-sm text-zinc-300">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Explanation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-300 leading-relaxed">{result.explanation}</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Indexing Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.indexingSuggestions.map((suggestion, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="flex-shrink-0 text-blue-400">📊</span>
                            <span className="text-sm text-zinc-300">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Tips</CardTitle>
                    </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.performanceTips.map((tip, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="flex-shrink-0 text-yellow-400">⚡</span>
                          <span className="text-sm text-zinc-300">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="quick" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Redis Performance Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Command Optimization</h4>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li>• Use SCAN instead of KEYS in production</li>
                    <li>• Use MGET/MSET for bulk operations</li>
                    <li>• Use pipelining for multiple commands</li>
                    <li>• Avoid Lua scripts for simple operations</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Data Structure Selection</h4>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li>• Use Hashes for objects with multiple fields</li>
                    <li>• Use Lists for ordered collections</li>
                    <li>• Use Sets for unique collections</li>
                    <li>• Use Sorted Sets for ranked data</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Memory Optimization</h4>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li>• Use Redis data structures efficiently</li>
                    <li>• Set appropriate TTL values</li>
                    <li>• Use Redis compression for large values</li>
                    <li>• Monitor memory usage with INFO</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Indexing & Search</h4>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li>• Use RediSearch for complex queries</li>
                    <li>• Create indexes on frequently queried fields</li>
                    <li>• Use RedisJSON for structured data</li>
                    <li>• Leverage vector search for AI applications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>LLM Provider</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value as LLMProvider)}
                    disabled={analyzing}
                  >
                    <option value="OpenAI">OpenAI</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="Ollama">Ollama (Local)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Model</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value as LLMModel)}
                    disabled={analyzing}
                  >
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="llama2">Llama 2</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>API Key (optional)</Label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={analyzing}
                  />
                </div>

                <div className="text-sm text-zinc-400">
                  <p>• GPT-4 provides the best optimization suggestions</p>
                  <p>• Claude 3 offers detailed explanations</p>
                  <p>• Local models work offline with limited capabilities</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
