import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import {
  listVectorIndexes,
  getVectorIndexInfo,
  getEmbeddingClusters,
  type VectorIndexInfo,
  type ClusterVisualization as ClusterVis,
  type ClusterPoint,
} from "../lib/api";
import { useConnectionStore } from "../stores/connectionStore";

interface ClusterVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
}

const CLUSTER_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#14b8a6",
];

export function ClusterVisualization({ isOpen, onClose }: ClusterVisualizationProps) {
  const getActiveConnection = useConnectionStore((s) => s.getActiveConnection);
  const activeConnection = getActiveConnection();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [indexes, setIndexes] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>("");
  const [indexInfo, setIndexInfo] = useState<VectorIndexInfo | null>(null);
  const [numClusters, setNumClusters] = useState(5);
  const [sampleSize, setSampleSize] = useState(500);
  const [clusterData, setClusterData] = useState<ClusterVis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ClusterPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ClusterPoint | null>(null);

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

  useEffect(() => {
    if (clusterData && canvasRef.current) {
      drawClusters();
    }
  }, [clusterData, selectedPoint]);

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

  const handleCluster = async () => {
    if (!activeConnection || !selectedIndex || !indexInfo?.vectorField) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getEmbeddingClusters(
        activeConnection,
        selectedIndex,
        indexInfo.vectorField,
        numClusters,
        sampleSize
      );
      setClusterData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clustering failed");
    } finally {
      setLoading(false);
    }
  };

  const drawClusters = () => {
    const canvas = canvasRef.current;
    if (!canvas || !clusterData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - 2 * padding);
      const y = padding + (i / 10) * (height - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    if (clusterData.clusterCentroids) {
      clusterData.clusterCentroids.forEach((centroid, i) => {
        const x = padding + centroid[0] * (width - 2 * padding);
        const y = padding + centroid[1] * (height - 2 * padding);
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fillStyle = CLUSTER_COLORS[i % CLUSTER_COLORS.length] + "30";
        ctx.fill();
        ctx.strokeStyle = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    clusterData.points.forEach((point) => {
      const x = padding + point.x * (width - 2 * padding);
      const y = padding + point.y * (height - 2 * padding);
      const isSelected = selectedPoint?.key === point.key;
      const isHovered = hoveredPoint?.key === point.key;

      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 8 : isHovered ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = CLUSTER_COLORS[point.clusterId % CLUSTER_COLORS.length];
      ctx.fill();

      if (isSelected || isHovered) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Dimension 1 (reduced)", width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Dimension 2 (reduced)", 0, 0);
    ctx.restore();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!clusterData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const padding = 40;
    const width = canvas.width;
    const height = canvas.height;

    let found: ClusterPoint | null = null;
    for (const point of clusterData.points) {
      const px = padding + point.x * (width - 2 * padding);
      const py = padding + point.y * (height - 2 * padding);
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (dist < 10) {
        found = point;
        break;
      }
    }
    setHoveredPoint(found);
  };

  const handleCanvasClick = () => {
    if (hoveredPoint) {
      setSelectedPoint(selectedPoint?.key === hoveredPoint.key ? null : hoveredPoint);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 w-full max-w-5xl rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Cluster Visualization</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-4">
            <h3 className="mb-4 text-lg font-medium">Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Index</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
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
                  <div className="space-y-1">
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
                <Label htmlFor="numClusters">Number of Clusters</Label>
                <Input
                  id="numClusters"
                  type="number"
                  min={2}
                  max={20}
                  value={numClusters}
                  onChange={(e) => setNumClusters(parseInt(e.target.value) || 5)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sampleSize">Sample Size</Label>
                <Input
                  id="sampleSize"
                  type="number"
                  min={100}
                  max={10000}
                  value={sampleSize}
                  onChange={(e) => setSampleSize(parseInt(e.target.value) || 500)}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button
                onClick={handleCluster}
                disabled={loading || !selectedIndex || !indexInfo?.vectorField}
                className="w-full"
              >
                {loading ? "Clustering..." : "Generate Clusters"}
              </Button>
            </div>
          </Card>

          <Card className="p-4 lg:col-span-2">
            <h3 className="mb-4 text-lg font-medium">
              Visualization
              {clusterData &&
                ` (${clusterData.points.length} points, ${clusterData.numClusters} clusters)`}
            </h3>

            <div className="relative">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="w-full rounded-md border border-zinc-800"
                onMouseMove={handleCanvasMouseMove}
                onClick={handleCanvasClick}
              />

              {hoveredPoint && (
                <div className="absolute right-2 top-2 rounded-md border border-zinc-700 bg-zinc-900 p-2 text-sm">
                  <div className="font-mono">{hoveredPoint.key}</div>
                  {hoveredPoint.label && (
                    <div className="max-w-[200px] truncate text-zinc-400">{hoveredPoint.label}</div>
                  )}
                  <div className="text-xs text-zinc-500">Cluster: {hoveredPoint.clusterId + 1}</div>
                </div>
              )}
            </div>

            {selectedPoint && (
              <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-mono font-medium">{selectedPoint.key}</h4>
                    {selectedPoint.label && (
                      <p className="mt-1 text-sm text-zinc-400">{selectedPoint.label}</p>
                    )}
                    <div className="mt-2 text-xs text-zinc-500">
                      Cluster: {selectedPoint.clusterId + 1} | Coordinates: (
                      {selectedPoint.x.toFixed(3)}, {selectedPoint.y.toFixed(3)})
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedPoint(null)}>
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {clusterData && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.from({ length: clusterData.numClusters }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md bg-zinc-800 px-2 py-1 text-xs"
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}
                    />
                    Cluster {i + 1}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
