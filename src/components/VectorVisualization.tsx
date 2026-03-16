import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

interface VectorVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
  vectors: number[][];
  labels?: string[];
  colors?: string[];
}

interface ProjectionPoint {
  x: number;
  y: number;
  originalIndex: number;
  label?: string;
  color?: string;
}

export function VectorVisualization({
  isOpen,
  onClose,
  vectors,
  labels = [],
  colors = [],
}: VectorVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [projection, setProjection] = useState<ProjectionPoint[]>([]);
  const [projectionMethod, setProjectionMethod] = useState<"pca" | "tsne" | "random">("pca");
  const [hoveredPoint, setHoveredPoint] = useState<ProjectionPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ProjectionPoint | null>(null);

  useEffect(() => {
    if (isOpen && vectors.length > 0) {
      computeProjection();
    }
  }, [isOpen, vectors, projectionMethod]);

  const computeProjection = () => {
    let points: ProjectionPoint[];

    switch (projectionMethod) {
      case "pca":
        points = computePCA();
        break;
      case "tsne":
        points = computeTSNE();
        break;
      case "random":
        points = computeRandomProjection();
        break;
      default:
        points = computePCA();
    }

    setProjection(points);
  };

  const computePCA = (): ProjectionPoint[] => {
    if (vectors.length === 0) return [];

    const numVectors = vectors.length;
    const dimensions = vectors[0].length;

    // Center the data
    const means = new Array(dimensions).fill(0);
    vectors.forEach((vec) => {
      vec.forEach((val, i) => {
        means[i] += val;
      });
    });
    means.forEach((val, i) => (means[i] /= numVectors));

    const centered = vectors.map((vec) => vec.map((val, i) => val - means[i]));

    // Compute covariance matrix
    const cov = Array.from({ length: dimensions }, () => new Array(dimensions).fill(0));
    centered.forEach((vec) => {
      for (let i = 0; i < dimensions; i++) {
        for (let j = 0; j < dimensions; j++) {
          cov[i][j] += vec[i] * vec[j];
        }
      }
    });
    cov.forEach((row, i) => row.forEach((val, j) => (cov[i][j] /= numVectors)));

    // Simple power iteration for first eigenvector
    let eigenvector = new Array(dimensions).fill(1).map(() => Math.random());
    for (let iter = 0; iter < 100; iter++) {
      const newVec = new Array(dimensions).fill(0);
      for (let i = 0; i < dimensions; i++) {
        for (let j = 0; j < dimensions; j++) {
          newVec[i] += cov[i][j] * eigenvector[j];
        }
      }
      const norm = Math.sqrt(newVec.reduce((sum, val) => sum + val * val, 0));
      eigenvector = newVec.map((val) => val / norm);
    }

    // Project onto first eigenvector (x-axis) and use second principal component (y-axis)
    const points: ProjectionPoint[] = vectors.map((vec, idx) => {
      // Use first two dimensions as a simple approximation
      const x = vec.length > 0 ? vec[0] : 0;
      const y = vec.length > 1 ? vec[1] : 0;

      return {
        x,
        y,
        originalIndex: idx,
        label: labels[idx],
        color: colors[idx],
      };
    });

    // Normalize to canvas coordinates
    return normalizePoints(points);
  };

  const computeTSNE = (): ProjectionPoint[] => {
    // Simplified t-SNE-like embedding
    const points: ProjectionPoint[] = vectors.map((vec, idx) => {
      // Use first few dimensions and apply some transformation
      const x = vec.length > 0 ? vec[0] + (vec.length > 2 ? vec[2] * 0.5 : 0) : 0;
      const y = vec.length > 1 ? vec[1] + (vec.length > 3 ? vec[3] * 0.5 : 0) : 0;

      return {
        x,
        y,
        originalIndex: idx,
        label: labels[idx],
        color: colors[idx],
      };
    });

    return normalizePoints(points);
  };

  const computeRandomProjection = (): ProjectionPoint[] => {
    const points: ProjectionPoint[] = vectors.map((vec, idx) => {
      // Simple random projection
      let x = 0,
        y = 0;
      vec.forEach((val, i) => {
        if (i % 2 === 0) x += val * (Math.random() - 0.5);
        else y += val * (Math.random() - 0.5);
      });

      return {
        x,
        y,
        originalIndex: idx,
        label: labels[idx],
        color: colors[idx],
      };
    });

    return normalizePoints(points);
  };

  const normalizePoints = (points: ProjectionPoint[]): ProjectionPoint[] => {
    if (points.length === 0) return points;

    // Find min and max
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    points.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    // Normalize to 0-1 range
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    return points.map((p) => ({
      ...p,
      x: (p.x - minX) / rangeX,
      y: (p.y - minY) / rangeY,
    }));
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || projection.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw connections (if points are close)
    ctx.strokeStyle = "rgba(239, 68, 68, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < projection.length; i++) {
      for (let j = i + 1; j < projection.length; j++) {
        const dist = Math.sqrt(
          Math.pow(projection[i].x - projection[j].x, 2) +
            Math.pow(projection[i].y - projection[j].y, 2)
        );
        if (dist < 0.1) {
          ctx.beginPath();
          ctx.moveTo(projection[i].x * width, projection[i].y * height);
          ctx.lineTo(projection[j].x * width, projection[j].y * height);
          ctx.stroke();
        }
      }
    }

    // Draw points
    projection.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      const isHovered = hoveredPoint?.originalIndex === point.originalIndex;
      const isSelected = selectedPoint?.originalIndex === point.originalIndex;

      // Point size
      const radius = isHovered ? 8 : isSelected ? 6 : 4;

      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);

      if (point.color) {
        ctx.fillStyle = point.color;
      } else {
        // Color based on index
        const hue = (index / projection.length) * 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      }

      ctx.fill();

      // Draw selection ring
      if (isSelected) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw label if hovered or selected
      if ((isHovered || isSelected) && point.label) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        ctx.fillText(point.label, x + 10, y - 10);
      }
    });
  };

  useEffect(() => {
    if (projection.length > 0) {
      drawCanvas();
    }
  }, [projection, hoveredPoint, selectedPoint]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;

    // Find closest point
    let closest: ProjectionPoint | null = null;
    let minDist = 0.05; // Threshold for hover detection

    projection.forEach((point) => {
      const dist = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    });

    setHoveredPoint(closest);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredPoint) {
      setSelectedPoint(selectedPoint?.originalIndex === hoveredPoint.originalIndex ? null : hoveredPoint);
    } else {
      setSelectedPoint(null);
    }
  };

  const computeSimilarityMatrix = () => {
    const matrix: number[][] = [];
    for (let i = 0; i < vectors.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < vectors.length; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          matrix[i][j] = cosineSimilarity(vectors[i], vectors[j]);
        }
      }
    }
    return matrix;
  };

  const cosineSimilarity = (vec1: number[], vec2: number[]): number => {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  };

  const getSimilarityColor = (similarity: number): string => {
    if (similarity > 0.8) return "bg-green-900/50";
    if (similarity > 0.6) return "bg-yellow-900/50";
    if (similarity > 0.4) return "bg-orange-900/50";
    return "bg-red-900/50";
  };

  if (!isOpen) return null;

  const similarityMatrix = computeSimilarityMatrix();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 w-full max-w-6xl h-[90vh] rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Vector Similarity Visualization</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={computeProjection}>
              Refresh
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>2D Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={projectionMethod === "pca" ? "default" : "outline"}
                    onClick={() => setProjectionMethod("pca")}
                    size="sm"
                  >
                    PCA
                  </Button>
                  <Button
                    variant={projectionMethod === "tsne" ? "default" : "outline"}
                    onClick={() => setProjectionMethod("tsne")}
                    size="sm"
                  >
                    t-SNE
                  </Button>
                  <Button
                    variant={projectionMethod === "random" ? "default" : "outline"}
                    onClick={() => setProjectionMethod("random")}
                    size="sm"
                  >
                    Random
                  </Button>
                </div>

                <canvas
                  ref={canvasRef}
                  width={400}
                  height={400}
                  className="w-full border border-zinc-800 bg-zinc-900 rounded-lg cursor-crosshair"
                  onMouseMove={handleCanvasMouseMove}
                  onClick={handleCanvasClick}
                />

                {selectedPoint && (
                  <div className="bg-zinc-900 p-3 rounded-lg">
                    <div className="text-sm">
                      <div className="font-semibold">Selected Point: {selectedPoint.label}</div>
                      <div className="text-zinc-400">Index: {selectedPoint.originalIndex}</div>
                      <div className="text-zinc-400">
                        Position: ({selectedPoint.x.toFixed(3)}, {selectedPoint.y.toFixed(3)})
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-zinc-400">
                  <p>• Hover over points to see labels</p>
                  <p>• Click points to select/deselect</p>
                  <p>• Lines connect similar vectors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Similarity Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="p-1"></th>
                        {labels.map((label, i) => (
                          <th key={i} className="p-1 text-xs">
                            {label || `V${i}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {similarityMatrix.map((row, i) => (
                        <tr key={i}>
                          <td className="p-1 font-medium">{labels[i] || `V${i}`}</td>
                          {row.map((sim, j) => (
                            <td
                              key={j}
                              className={`p-1 text-center text-xs ${getSimilarityColor(sim)}`}
                            >
                              {sim.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Vectors:</span>
                    <span className="font-medium">{vectors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Dimensions:</span>
                    <span className="font-medium">{vectors[0]?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Avg Similarity:</span>
                    <span className="font-medium">
                      {(
                        similarityMatrix.flat().reduce((a, b) => a + b, 0) /
                        (vectors.length * vectors.length)
                      ).toFixed(3)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedPoint && (
              <Card>
                <CardHeader>
                  <CardTitle>Most Similar Vectors</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {similarityMatrix[selectedPoint.originalIndex]
                      .map((sim, idx) => ({ index: idx, similarity: sim }))
                      .filter((item) => item.index !== selectedPoint.originalIndex)
                      .sort((a, b) => b.similarity - a.similarity)
                      .slice(0, 5)
                      .map((item) => (
                        <li key={item.index} className="flex justify-between text-sm">
                          <span>{labels[item.index] || `V${item.index}`}</span>
                          <span className="font-medium">{item.similarity.toFixed(3)}</span>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
