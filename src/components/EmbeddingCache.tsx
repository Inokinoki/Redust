import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";

interface EmbeddingCacheItem {
  id: string;
  text: string;
  dimension: number;
  createdAt: Date;
}

interface EmbeddingCacheProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmbeddingCache({ isOpen, onClose }: EmbeddingCacheProps) {
  const [embeddings, setEmbeddings] = useState<EmbeddingCacheItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleUpload = async () => {
    setLoading(true);
    try {
      // Simulated upload - in production this would process files
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockEmbeddings: EmbeddingCacheItem[] = [
        {
          id: "1",
          text: "Sample document 1",
          dimension: 1536,
          createdAt: new Date(),
        },
        {
          id: "2",
          text: "Sample document 2",
          dimension: 1536,
          createdAt: new Date(),
        },
        {
          id: "3",
          text: "Sample document 3",
          dimension: 1536,
          createdAt: new Date(),
        },
      ];

      setEmbeddings(mockEmbeddings);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmbeddings = embeddings.filter((e) =>
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
                <select className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600">
                  <option value="">Select an index...</option>
                  <option value="docs">Documents</option>
                  <option value="products">Products</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Upload Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    Browse Files
                  </Button>
                  <Button variant="outline" size="sm">
                    Paste JSON
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Batch Size</Label>
                <select className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
                  <option value="100">100 embeddings</option>
                  <option value="1000">1,000 embeddings</option>
                  <option value="10000">10,000 embeddings</option>
                </select>
              </div>

              <Button onClick={handleUpload} disabled={loading} className="w-full">
                {loading ? "Uploading..." : "Upload Embeddings"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-medium">Cached Embeddings ({embeddings.length})</h3>

            <div className="mb-4 space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search embeddings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-96 flex-1 overflow-auto rounded-lg border border-zinc-800">
              <table className="w-full">
                <thead className="sticky top-0 bg-zinc-950">
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">
                      Text Preview
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">
                      Dimension
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmbeddings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        No embeddings found
                      </td>
                    </tr>
                  ) : (
                    filteredEmbeddings.map((emb) => (
                      <tr key={emb.id} className="border-b border-zinc-800 hover:bg-zinc-900">
                        <td className="px-4 py-2 text-sm">{emb.id}</td>
                        <td className="max-w-xs truncate px-4 py-2 text-sm">{emb.text}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="text-green-400">{emb.dimension}d</span>
                        </td>
                        <td className="px-4 py-2 text-sm text-zinc-400">
                          {emb.createdAt.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm text-zinc-400">
              <span>
                Showing {filteredEmbeddings.length} of {embeddings.length} embeddings
              </span>
              <span>Cache size: ~{(embeddings.length * 8).toFixed(2)} KB</span>
            </div>
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
