import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import {
  listVectorIndexes,
  getVectorIndexInfo,
  uploadEmbeddings,
  getCachedEmbedding,
  deleteVectorIndex,
  type VectorIndexInfo,
  type EmbeddingCacheItem,
} from "../lib/api";
import { useConnectionStore } from "../stores/connectionStore";

interface EmbeddingCacheProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmbeddingCache({ isOpen, onClose }: EmbeddingCacheProps) {
  const getActiveConnection = useConnectionStore((s) => s.getActiveConnection);
  const activeConnection = getActiveConnection();

  const [indexes, setIndexes] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>("");
  const [indexInfo, setIndexInfo] = useState<VectorIndexInfo | null>(null);
  const [embeddings, setEmbeddings] = useState<EmbeddingCacheItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [viewingKey, setViewingKey] = useState<string | null>(null);
  const [viewedEmbedding, setViewedEmbedding] = useState<EmbeddingCacheItem | null>(null);

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

  const handleUpload = async () => {
    if (!activeConnection || !selectedIndex || !jsonInput.trim()) return;

    setUploading(true);
    setError(null);
    try {
      const items: EmbeddingCacheItem[] = JSON.parse(jsonInput);
      if (!Array.isArray(items)) {
        setError("Input must be an array of embedding items");
        return;
      }

      await uploadEmbeddings(activeConnection, {
        indexName: selectedIndex,
        embeddings: items,
      });

      setEmbeddings(items);
      setJsonInput("");
      loadIndexInfo();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleViewEmbedding = async (key: string) => {
    if (!activeConnection) return;
    setLoading(true);
    try {
      const item = await getCachedEmbedding(activeConnection, key);
      setViewedEmbedding(item ? { key, text: item.text, embedding: item.embedding } : null);
      setViewingKey(key);
    } catch (e) {
      console.error("Failed to load embedding:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIndex = async () => {
    if (!activeConnection || !selectedIndex) return;
    if (!confirm(`Delete index "${selectedIndex}" and all its data?`)) return;

    try {
      await deleteVectorIndex(activeConnection, selectedIndex);
      setIndexes(indexes.filter((i) => i !== selectedIndex));
      setSelectedIndex("");
      setIndexInfo(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const filteredEmbeddings = embeddings.filter(
    (e) =>
      e.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 w-full max-w-5xl rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Embedding Cache</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-medium">Upload Embeddings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Index</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(e.target.value)}
                  disabled={uploading}
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-zinc-400">Dimensions:</span>{" "}
                      <span className="text-green-400">{indexInfo.vectorDimensions || "?"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Documents:</span>{" "}
                      <span className="text-blue-400">{indexInfo.numDocs}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Embeddings JSON</Label>
                <textarea
                  className="flex min-h-[150px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  placeholder={`[
  {
    "key": "doc:1",
    "text": "Sample text",
    "embedding": [0.1, 0.2, 0.3, ...]
  }
]`}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  disabled={uploading}
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !selectedIndex || !jsonInput.trim()}
                >
                  {uploading ? "Uploading..." : "Upload Embeddings"}
                </Button>
                <Button variant="destructive" onClick={handleDeleteIndex} disabled={!selectedIndex}>
                  Delete Index
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-medium">Cached Embeddings ({embeddings.length})</h3>

            <div className="mb-4 space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by key or text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-72 flex-1 overflow-auto rounded-lg border border-zinc-800">
              <table className="w-full">
                <thead className="sticky top-0 bg-zinc-950">
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">Key</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">Text</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">Dims</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmbeddings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-400">
                        No embeddings found
                      </td>
                    </tr>
                  ) : (
                    filteredEmbeddings.map((emb) => (
                      <tr key={emb.key} className="border-b border-zinc-800 hover:bg-zinc-900">
                        <td className="max-w-[120px] truncate px-4 py-2 font-mono text-sm">
                          {emb.key}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-2 text-sm">{emb.text}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="text-green-400">{emb.embedding.length}d</span>
                        </td>
                        <td className="px-4 py-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewEmbedding(emb.key)}
                            disabled={loading}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {viewedEmbedding && (
              <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium">{viewingKey}</h4>
                  <Button size="sm" variant="ghost" onClick={() => setViewedEmbedding(null)}>
                    Close
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-zinc-400">Text:</span> <span>{viewedEmbedding.text}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Embedding preview:</span>
                    <div className="mt-1 max-h-20 overflow-auto rounded bg-zinc-800 p-2 font-mono text-xs">
                      [
                      {viewedEmbedding.embedding
                        .slice(0, 10)
                        .map((v) => v.toFixed(4))
                        .join(", ")}
                      {viewedEmbedding.embedding.length > 10 && ", ..."}]
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
