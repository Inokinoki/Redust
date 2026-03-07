import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import {
  listVectorIndexes,
  getVectorIndexInfo,
  vectorSearchApi,
  type VectorIndexInfo,
  type VectorSearchResult,
} from "../lib/api";
import { useConnectionStore } from "../stores/connectionStore";

interface VectorSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VectorSearch({ isOpen, onClose }: VectorSearchProps) {
  const getActiveConnection = useConnectionStore((s) => s.getActiveConnection);
  const activeConnection = getActiveConnection();
  const [indexes, setIndexes] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>("");
  const [indexInfo, setIndexInfo] = useState<VectorIndexInfo | null>(null);
  const [queryVector, setQueryVector] = useState("");
  const [results, setResults] = useState<VectorSearchResult[]>([]);
  const [topK, setTopK] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeConnection) {
      loadIndexes();
    }
  }, [isOpen, activeConnection]);

  useEffect(() => {
    if (selectedIndex && activeConnection) {
      loadIndexInfo();
    }
  }, [selectedIndex]);

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

  const handleSearch = async () => {
    if (!activeConnection || !selectedIndex || !queryVector.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const vector = parseVector(queryVector);
      if (!vector) {
        setError("Invalid vector format. Use comma-separated numbers.");
        return;
      }

      const res = await vectorSearchApi(activeConnection, {
        indexName: selectedIndex,
        queryVector: vector,
        vectorField: indexInfo?.vectorField || "embedding",
        topK,
        returnFields: ["text", "metadata"],
      });

      setResults(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 w-full max-w-4xl rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Vector Search</h2>

        <Card className="p-6">
          <div className="space-y-4">
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
              <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-zinc-400">Dimensions:</span>{" "}
                    <span className="text-green-400">{indexInfo.vectorDimensions || "?"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Documents:</span>{" "}
                    <span className="text-blue-400">{indexInfo.numDocs}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Vector Field:</span>{" "}
                    <span className="text-purple-400">{indexInfo.vectorField || "?"}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="queryVector">Query Vector (comma-separated)</Label>
              <textarea
                id="queryVector"
                className="flex min-h-[80px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                placeholder="0.1, 0.2, 0.3, ..."
                value={queryVector}
                onChange={(e) => setQueryVector(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topK">Top K Results</Label>
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
            </div>

            {error && (
              <div className="rounded-md border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              onClick={handleSearch}
              disabled={loading || !selectedIndex || !queryVector.trim()}
              className="w-full"
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-medium">Results ({results.length})</h3>
              <div className="max-h-96 space-y-2 overflow-auto">
                {results.map((result, index) => (
                  <div
                    key={result.key}
                    className="rounded-md border border-zinc-800 bg-zinc-900 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-mono text-sm">{result.key}</div>
                        {result.fields?.text && (
                          <div className="mt-1 truncate text-xs text-zinc-400">
                            {result.fields.text}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-zinc-400">
                          Score: {result.score.toFixed(4)}
                        </span>
                        <span className="rounded bg-red-900/50 px-2 py-1 text-xs text-red-400">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
