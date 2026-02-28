import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import type { SortedSetMember } from "../lib/api";

interface VectorSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VectorSearch({ isOpen, onClose }: VectorSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SortedSetMember[]>([]);
  const [topK, setTopK] = useState(10);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearching(true);
    try {
      // Simulated vector search - in production this would call actual API
      // For now, we'll show mock results
      await new Promise((resolve) => setTimeout(resolve, 500));

      setResults([
        { member: "result1", score: 0.95 },
        { member: "result2", score: 0.87 },
        { member: "result3", score: 0.82 },
        { member: "result4", score: 0.78 },
      ]);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
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
              <Label htmlFor="query">Query Text</Label>
              <Input
                id="query"
                placeholder="Enter your query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={searching}
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
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  disabled={searching}
                />
              </div>

              <div className="space-y-2">
                <Label>Distance Metric</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  disabled={searching}
                >
                  <option value="COSINE">COSINE</option>
                  <option value="L2">L2 Distance</option>
                  <option value="IP">Inner Product</option>
                </select>
              </div>
            </div>

            <Button onClick={handleSearch} disabled={searching || !query.trim()} className="w-full">
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-medium">Results</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={result.member}
                    className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 p-3"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm">{result.member}</div>
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
