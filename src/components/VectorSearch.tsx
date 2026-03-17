import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  listVectorIndexes,
  getVectorIndexInfo,
  vectorSearchApi,
  llmGenerateEmbedding,
  type VectorIndexInfo,
  type VectorSearchResult,
  type LLMProvider,
} from "../lib/api";
import { useConnectionStore } from "../stores/connectionStore";

interface VectorSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FilterCondition {
  field: string;
  operator: "eq" | "ne" | "gt" | "lt" | "gte" | "lte";
  value: string;
}

export function VectorSearch({ isOpen, onClose }: VectorSearchProps) {
  const getActiveConnection = useConnectionStore((s) => s.getActiveConnection);
  const activeConnection = getActiveConnection();

  const [indexes, setIndexes] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>("");
  const [indexInfo, setIndexInfo] = useState<VectorIndexInfo | null>(null);

  // Search state
  const [searchMode, setSearchMode] = useState<"vector" | "text">("vector");
  const [queryVector, setQueryVector] = useState("");
  const [queryText, setQueryText] = useState("");
  const [embeddingProvider, setEmbeddingProvider] = useState<LLMProvider>("OpenAI");
  const [embeddingApiKey, setEmbeddingApiKey] = useState("");

  // Search parameters
  const [topK, setTopK] = useState(10);
  const [scoreThreshold, setScoreThreshold] = useState(0.0);
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  // Results state
  const [results, setResults] = useState<VectorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadIndexes = async () => {
    if (!activeConnection) return;
    try {
      const idx = await listVectorIndexes(activeConnection);
      setIndexes(idx);
      if (idx.length > 0 && !selectedIndex) {
        setSelectedIndex(idx[0]);
      }
    } catch (e) {
      console.error("Failed to load indexes:", e);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadIndexInfo = async () => {
    if (!activeConnection || !selectedIndex) return;
    try {
      const info = await getVectorIndexInfo(activeConnection, selectedIndex);
      setIndexInfo(info);
    } catch (e) {
      console.error("Failed to load index info:", e);
      setIndexInfo(null);
    }
  };

  useEffect(() => {
    if (isOpen && activeConnection) {
      loadIndexes();
    }
  }, [isOpen, activeConnection, loadIndexes]);

  useEffect(() => {
    if (selectedIndex && activeConnection) {
      loadIndexInfo();
    }
  }, [selectedIndex, activeConnection, loadIndexInfo]);

  const addFilter = () => {
    setFilters([...filters, { field: "", operator: "eq", value: "" }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<FilterCondition>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
      const response = await llmGenerateEmbedding({
        text,
        provider: embeddingProvider,
        api_key: embeddingApiKey || undefined,
      });
      return response.embedding;
    } catch (e) {
      throw new Error(`Failed to generate embedding: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleSearch = async () => {
    if (!activeConnection || !selectedIndex) return;

    // Validate input based on mode
    if (searchMode === "vector" && !queryVector.trim()) {
      setError("Please enter a query vector");
      return;
    }
    if (searchMode === "text" && !queryText.trim()) {
      setError("Please enter query text");
      return;
    }

    setLoading(true);
    setError(null);
    setSearchTime(null);

    const startTime = performance.now();

    try {
      let vector: number[] | null;

      if (searchMode === "text") {
        // Generate embedding from text
        vector = await generateEmbedding(queryText);
      } else {
        // Parse vector input
        vector = parseVector(queryVector);
        if (!vector) {
          setError("Invalid vector format. Use comma-separated numbers.");
          return;
        }
      }

      // Validate vector dimensions
      if (indexInfo?.vectorDimensions && vector.length !== indexInfo.vectorDimensions) {
        setError(`Vector dimension mismatch. Expected ${indexInfo.vectorDimensions}, got ${vector.length}`);
        return;
      }

      // Build search parameters
      const searchParams: {
        indexName: string;
        queryVector: number[];
        vectorField: string;
        topK: number;
        returnFields: string[];
        minScore?: number;
      } = {
        indexName: selectedIndex,
        queryVector: vector,
        vectorField: indexInfo?.vectorField || "embedding",
        topK,
        returnFields: ["text", "metadata", "title", "content"],
      };

      // Apply score threshold if set
      if (scoreThreshold > 0) {
        searchParams.minScore = scoreThreshold;
      }

      // Execute search
      let searchResults = await vectorSearchApi(activeConnection, searchParams);

      // Apply client-side filters (if any)
      if (filters.length > 0) {
        searchResults = searchResults.filter((result) => {
          return filters.every((filter) => {
            const fieldValue = result.fields?.[filter.field];
            if (fieldValue === undefined) return true;

            const filterValue = parseFloat(filter.value);
            const fieldValueNum = typeof fieldValue === "number" ? fieldValue : parseFloat(fieldValue);

            switch (filter.operator) {
              case "eq":
                return fieldValue == filter.value;
              case "ne":
                return fieldValue != filter.value;
              case "gt":
                return fieldValueNum > filterValue;
              case "lt":
                return fieldValueNum < filterValue;
              case "gte":
                return fieldValueNum >= filterValue;
              case "lte":
                return fieldValueNum <= filterValue;
              default:
                return true;
            }
          });
        });
      }

      // Apply score threshold (client-side as backup)
      if (scoreThreshold > 0) {
        searchResults = searchResults.filter((r) => r.score >= scoreThreshold);
      }

      setResults(searchResults);
      setSearchTime(performance.now() - startTime);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const parseVector = (input: string): number[] | null => {
    try {
      const parts = input.split(",").map((s) => parseFloat(s.trim()));
      if (parts.some(isNaN)) return null;
      return parts;
    } catch {
      return null;
    }
  };

  const exportResults = () => {
    const data = results.map((r, i) => ({
      rank: i + 1,
      key: r.key,
      score: r.score,
      fields: r.fields,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vector-search-${selectedIndex}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 0.8) return "bg-green-900/30";
    if (score >= 0.6) return "bg-yellow-900/30";
    return "bg-red-900/30";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 w-full max-w-6xl h-[90vh] rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Vector Search</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportResults} disabled={results.length === 0}>
              Export Results
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="results">
              Results ({results.length})
            </TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Index Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Index</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select an index...</option>
                    {indexes.map((idx) => (
                      <option key={idx} value={idx}>
                        {idx}
                      </option>
                    ))}
                  </select>
                </div>

                {indexInfo && (
                  <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-zinc-400 mb-1">Dimensions</div>
                        <div className="text-green-400 font-mono text-lg">{indexInfo.vectorDimensions || "?"}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400 mb-1">Documents</div>
                        <div className="text-blue-400 font-mono text-lg">{indexInfo.numDocs.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400 mb-1">Vector Field</div>
                        <div className="text-purple-400 font-mono text-lg">{indexInfo.vectorField || "?"}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400 mb-1">Status</div>
                        <div className="text-green-400 font-mono text-lg">{indexInfo.indexStatus}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Query Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant={searchMode === "vector" ? "default" : "outline"}
                    onClick={() => setSearchMode("vector")}
                    className="flex-1"
                  >
                    Vector Input
                  </Button>
                  <Button
                    variant={searchMode === "text" ? "default" : "outline"}
                    onClick={() => setSearchMode("text")}
                    className="flex-1"
                  >
                    Text to Vector
                  </Button>
                </div>

                {searchMode === "vector" ? (
                  <div className="space-y-2">
                    <Label htmlFor="queryVector">Query Vector (comma-separated)</Label>
                    <textarea
                      id="queryVector"
                      className="flex min-h-[120px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                      placeholder="0.1, 0.2, 0.3, ..."
                      value={queryVector}
                      onChange={(e) => setQueryVector(e.target.value)}
                      disabled={loading}
                    />
                    <div className="text-xs text-zinc-400">
                      Dimensions: {queryVector ? queryVector.split(",").length : 0}
                      {indexInfo?.vectorDimensions && ` / ${indexInfo.vectorDimensions}`}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="queryText">Query Text</Label>
                      <textarea
                        id="queryText"
                        className="flex min-h-[120px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                        placeholder="Enter your query text here..."
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Embedding Provider</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                          value={embeddingProvider}
                          onChange={(e) => setEmbeddingProvider(e.target.value as LLMProvider)}
                          disabled={loading}
                        >
                          <option value="OpenAI">OpenAI</option>
                          <option value="Ollama">Ollama (Local)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>API Key (optional)</Label>
                        <Input
                          type="password"
                          placeholder="sk-..."
                          value={embeddingApiKey}
                          onChange={(e) => setEmbeddingApiKey(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="topK">Top K Results (1-100)</Label>
                    <Input
                      id="topK"
                      type="number"
                      min={1}
                      max={100}
                      value={topK}
                      onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scoreThreshold">Min Score (0-1)</Label>
                    <Input
                      id="scoreThreshold"
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={scoreThreshold}
                      onChange={(e) => setScoreThreshold(parseFloat(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-md border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleSearch}
                  disabled={loading || !selectedIndex}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Searching..." : "Search"}
                </Button>

                {searchTime && (
                  <div className="text-center text-sm text-zinc-400">
                    Search completed in {searchTime.toFixed(2)}ms
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {results.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-zinc-400">
                  <p>No results yet. Run a search to see results here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Search Results ({results.length})</CardTitle>
                  </CardHeader>
                </Card>

                <div className="max-h-[60vh] space-y-3 overflow-auto pr-2">
                  {results.map((result, index) => (
                    <Card key={result.key} className={getScoreBackground(result.score)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm font-medium truncate">{result.key}</span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${getScoreBackground(result.score)} ${getScoreColor(result.score)}`}>
                                #{index + 1}
                              </span>
                            </div>

                            {result.fields?.text && (
                              <div className="text-sm text-zinc-300 mb-2 line-clamp-2">
                                {result.fields.text}
                              </div>
                            )}

                            {result.fields?.title && (
                              <div className="text-sm font-medium text-zinc-400 mb-1">
                                {result.fields.title}
                              </div>
                            )}

                            {result.fields?.metadata && (
                              <div className="text-xs text-zinc-500 mt-2">
                                {JSON.stringify(result.fields.metadata)}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                              {(result.score * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-zinc-400">
                              similarity
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hybrid Search Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-zinc-400 mb-4">
                  Add filters to combine vector similarity with field-based filtering
                </div>

                {filters.map((filter, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Field name"
                      value={filter.field}
                      onChange={(e) => updateFilter(index, { field: e.target.value })}
                      className="flex-1"
                    />
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, { operator: e.target.value as FilterCondition["operator"] })}
                      className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                    >
                      <option value="eq">=</option>
                      <option value="ne">≠</option>
                      <option value="gt">&gt;</option>
                      <option value="lt">&lt;</option>
                      <option value="gte">≥</option>
                      <option value="lte">≤</option>
                    </select>
                    <Input
                      placeholder="Value"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      className="flex-1"
                    />
                    <Button variant="destructive" size="icon" onClick={() => removeFilter(index)}>
                      ×
                    </Button>
                  </div>
                ))}

                <Button onClick={addFilter} variant="outline" className="w-full">
                  + Add Filter
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-400">
                <p>• Use <strong>Top K</strong> to limit result size and improve performance</p>
                <p>• Set <strong>Min Score</strong> to filter out low-quality matches</p>
                <p>• <strong>Hybrid filters</strong> help narrow results before vector comparison</p>
                <p>• For large indexes, consider using Redis clustering for parallel search</p>
                <p>• Cache frequently used embeddings to reduce API calls</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
