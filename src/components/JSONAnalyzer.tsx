import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useConnectionStore } from "../stores/connectionStore";
import * as api from "../lib/api";

interface JSONAnalysisResult {
  summary: string;
  structure: JSONStructureInfo;
  insights: string[];
  recommendations: string[];
  schema?: JSONSchema;
  statistics?: JSONStatistics;
}

interface JSONStructureInfo {
  rootType: string;
  depth: number;
  totalKeys: number;
  keyTypes: Record<string, number>;
  arrays: number;
  objects: number;
  primitives: number;
}

interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  description?: string;
}

interface JSONStatistics {
  size: number;
  complexity: number;
  nestingLevel: number;
  uniquePaths: number;
  dataSize: number;
}

interface JSONAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  keyName: string;
  jsonData: unknown;
}

export function JSONAnalyzer({ isOpen, onClose, keyName, jsonData }: JSONAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<JSONAnalysisResult | null>(null);
  const [analysisType] = useState<"structure" | "ai" | "both">("both");

  const llmModel = "gpt-4-turbo";
  const apiKey = "";

  const activeConnection = useConnectionStore((s) => s.getActiveConnection());

  useEffect(() => {
    if (isOpen && jsonData) {
      performAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, jsonData]);

  const analyzeStructure = (): JSONStructureInfo => {
    let totalKeys = 0;
    let depth = 0;
    const keyTypes: Record<string, number> = {};
    let arrays = 0;
    let objects = 0;
    let primitives = 0;

    const traverse = (obj: unknown, currentDepth: number) => {
      depth = Math.max(depth, currentDepth);

      if (Array.isArray(obj)) {
        arrays++;
        obj.forEach((item) => traverse(item, currentDepth + 1));
      } else if (obj !== null && typeof obj === "object") {
        objects++;
        Object.keys(obj as object).forEach((key) => {
          totalKeys++;
          const value = (obj as Record<string, unknown>)[key];
          const type = Array.isArray(value) ? "array" : typeof value;
          keyTypes[type] = (keyTypes[type] || 0) + 1;
          traverse(value, currentDepth + 1);
        });
      } else {
        primitives++;
      }
    };

    traverse(jsonData, 0);

    return {
      rootType: Array.isArray(jsonData) ? "array" : typeof jsonData,
      depth,
      totalKeys,
      keyTypes,
      arrays,
      objects,
      primitives,
    };
  };

  const generateSchema = (obj: unknown): JSONSchema => {
    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        return {
          type: "array",
          items: generateSchema(obj[0]),
        };
      }
      return { type: "array", items: { type: "any" } };
    }

    if (obj !== null && typeof obj === "object") {
      const properties: Record<string, JSONSchema> = {};
      const required: string[] = [];

      Object.keys(obj as object).forEach((key) => {
        properties[key] = generateSchema((obj as Record<string, unknown>)[key]);
        required.push(key);
      });

      return {
        type: "object",
        properties,
        required,
      };
    }

    return { type: typeof obj };
  };

  const calculateStatistics = (): JSONStatistics => {
    const jsonString = JSON.stringify(jsonData);
    const size = new Blob([jsonString]).size;

    // Simple complexity calculation
    let complexity = 0;
    const traverse = (obj: unknown) => {
      if (Array.isArray(obj)) {
        complexity += obj.length * 0.5;
        obj.forEach(traverse);
      } else if (obj !== null && typeof obj === "object") {
        complexity += Object.keys(obj).length;
        Object.values(obj).forEach(traverse);
      }
    };
    traverse(jsonData);

    // Count unique paths
    let uniquePaths = 0;
    const getPaths = (obj: unknown, prefix = ""): string[] => {
      if (Array.isArray(obj)) {
        return obj.flatMap((item, i) => getPaths(item, `${prefix}[${i}]`));
      }
      if (obj !== null && typeof obj === "object") {
        return Object.keys(obj as object).flatMap((key) => {
          uniquePaths++;
          return getPaths((obj as Record<string, unknown>)[key], `${prefix}.${key}`);
        });
      }
      return [prefix];
    };
    getPaths(jsonData);

    return {
      size,
      complexity: Math.round(complexity),
      nestingLevel: analyzeStructure().depth,
      uniquePaths,
      dataSize: jsonString.length,
    };
  };

  const performAIAnalysis = async (): Promise<string> => {
    if (!activeConnection) {
      throw new Error("No active connection");
    }

    try {
      const jsonPreview = JSON.stringify(jsonData, null, 2);
      const truncatedJson = jsonPreview.slice(0, 8000); // Limit context size

      const prompt = `Analyze this Redis JSON document and provide:
1. A summary of its purpose and structure
2. Key insights about the data patterns
3. Recommendations for optimization or indexing strategies
4. Potential issues or improvements

JSON Key: ${keyName}
JSON Data:
${truncatedJson}

${jsonPreview.length > 8000 ? "(Data truncated for analysis)" : ""}

Provide analysis in a clear, structured format.`;

      const response = await api.llmChat({
        model: llmModel,
        messages: [
          {
            role: "system",
            content:
              "You are an expert database analyst specializing in Redis JSON data structures and optimization.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        api_key: apiKey || undefined,
      });

      return response.content;
    } catch (e) {
      throw new Error(`AI analysis failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const performAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const structureInfo = analyzeStructure();
      const schema = generateSchema(jsonData);
      const statistics = calculateStatistics();

      let aiInsights: string[] = [];
      let recommendations: string[] = [];
      let summary = "";

      if (analysisType === "ai" || analysisType === "both") {
        const aiResult = await performAIAnalysis();

        // Parse AI response
        const lines = aiResult.split("\n");
        let currentSection = "";

        lines.forEach((line) => {
          if (line.toLowerCase().includes("summary") || line.toLowerCase().includes("overview")) {
            currentSection = "summary";
          } else if (line.toLowerCase().includes("insight") || line.toLowerCase().includes("key finding")) {
            currentSection = "insights";
          } else if (
            line.toLowerCase().includes("recommendation") ||
            line.toLowerCase().includes("optimization")
          ) {
            currentSection = "recommendations";
          } else if (line.trim() && !line.match(/^\d+\./) && !line.match(/^[-*]/)) {
            if (currentSection === "summary") {
              summary += line + " ";
            } else if (currentSection === "insights" && line.trim()) {
              aiInsights.push(line.replace(/^[-*]\s*/, "").trim());
            } else if (currentSection === "recommendations" && line.trim()) {
              recommendations.push(line.replace(/^[-*]\s*/, "").trim());
            }
          }
        });

        // If parsing failed, use the whole response as summary
        if (!summary && aiInsights.length === 0) {
          summary = aiResult;
        }
      }

      // Generate structural insights
      if (analysisType === "structure" || analysisType === "both") {
        const structuralInsights = generateStructuralInsights(structureInfo, statistics);
        aiInsights = [...aiInsights, ...structuralInsights];

        const structuralRecommendations = generateStructuralRecommendations(structureInfo, statistics);
        recommendations = [...recommendations, ...structuralRecommendations];

        if (!summary) {
          summary = generateStructuralSummary(structureInfo, statistics);
        }
      }

      setAnalysis({
        summary: summary || "JSON document analysis completed.",
        structure: structureInfo,
        insights: aiInsights,
        recommendations,
        schema,
        statistics,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const generateStructuralInsights = (structure: JSONStructureInfo, stats: JSONStatistics): string[] => {
    const insights: string[] = [];

    if (structure.depth > 5) {
      insights.push(`Deep nesting detected (${structure.depth} levels). Consider flattening for better performance.`);
    }

    if (structure.arrays > structure.objects * 2) {
      insights.push(
        `Array-heavy structure (${structure.arrays} arrays). May benefit from RedisJSON path optimizations.`
      );
    }

    if (stats.size > 1024 * 100) {
      insights.push(`Large document (${(stats.size / 1024).toFixed(1)}KB). Consider data partitioning.`);
    }

    if (structure.keyTypes["string"] && structure.keyTypes["string"] > 10) {
      insights.push(
        `Contains ${structure.keyTypes["string"]} string fields. Consider compression for large strings.`
      );
    }

    const arrayTypes = Object.entries(structure.keyTypes)
      .filter(([type]) => type === "array")
      .map(([type, count]) => `${count} ${type}s`);
    if (arrayTypes.length > 0) {
      insights.push(`Mixed data types detected: ${arrayTypes.join(", ")}`);
    }

    return insights;
  };

  const generateStructuralRecommendations = (
    structure: JSONStructureInfo,
    stats: JSONStatistics
  ): string[] => {
    const recommendations: string[] = [];

    if (structure.totalKeys > 50) {
      recommendations.push(
        "Consider indexing frequently queried fields using RediSearch for faster access."
      );
    }

    if (structure.depth > 4) {
      recommendations.push(
        "Flatten nested structures to improve query performance and reduce complexity."
      );
    }

    if (stats.complexity > 100) {
      recommendations.push(
        "High complexity detected. Consider breaking this into multiple smaller JSON documents."
      );
    }

    if (structure.arrays > 0 && structure.objects > 0) {
      recommendations.push(
        "Mix of arrays and objects detected. Use JSONPath expressions for efficient querying."
      );
    }

    if (stats.size > 1024 * 50) {
      recommendations.push(
        "Large document size. Consider using Redis JSON's compression or data archiving strategies."
      );
    }

    recommendations.push("Use RedisJSON's binary storage format for better memory efficiency.");
    recommendations.push("Consider implementing a caching layer for frequently accessed data.");

    return recommendations;
  };

  const generateStructuralSummary = (structure: JSONStructureInfo, stats: JSONStatistics): string => {
    const sizeDesc = stats.size < 1024 ? `${stats.size}B` : `${(stats.size / 1024).toFixed(1)}KB`;
    return `This is a ${structure.rootType}-based JSON document containing ${structure.totalKeys} keys with ${structure.arrays} arrays and ${structure.objects} objects. The document has a maximum nesting depth of ${structure.depth} and a total size of ${sizeDesc}.`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 w-full max-w-6xl h-[90vh] rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">JSON Document Analysis</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={performAnalysis} disabled={analyzing}>
              {analyzing ? "Analyzing..." : "Re-analyze"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Key Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-400">Key:</span>{" "}
                        <span className="font-mono text-zinc-200">{keyName}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Root Type:</span>{" "}
                        <span className="text-green-400">{analysis?.structure.rootType || "..."}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Total Keys:</span>{" "}
                        <span className="text-blue-400">{analysis?.structure.totalKeys || 0}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Size:</span>{" "}
                        <span className="text-purple-400">
                          {analysis?.statistics
                            ? `${(analysis.statistics.size / 1024).toFixed(2)} KB`
                            : "..."}
                        </span>
                      </div>
                    </div>
                  </div>

                  {analysis && (
                    <div>
                      <h3 className="font-semibold mb-2">Summary</h3>
                      <p className="text-sm text-zinc-300 leading-relaxed">{analysis.summary}</p>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-md border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {analysis && analysis.statistics && (
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {analysis.statistics.complexity}
                      </div>
                      <div className="text-xs text-zinc-400">Complexity Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {analysis.statistics.nestingLevel}
                      </div>
                      <div className="text-xs text-zinc-400">Nesting Levels</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {analysis.statistics.uniquePaths}
                      </div>
                      <div className="text-xs text-zinc-400">Unique Paths</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="structure" className="space-y-4">
            {analysis && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Structure Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-zinc-900 rounded-lg">
                          <div className="text-2xl font-bold text-blue-400">{analysis.structure.arrays}</div>
                          <div className="text-sm text-zinc-400">Arrays</div>
                        </div>
                        <div className="text-center p-4 bg-zinc-900 rounded-lg">
                          <div className="text-2xl font-bold text-green-400">
                            {analysis.structure.objects}
                          </div>
                          <div className="text-sm text-zinc-400">Objects</div>
                        </div>
                        <div className="text-center p-4 bg-zinc-900 rounded-lg">
                          <div className="text-2xl font-bold text-purple-400">
                            {analysis.structure.primitives}
                          </div>
                          <div className="text-sm text-zinc-400">Primitives</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Data Types Distribution</h4>
                        <div className="space-y-2">
                          {Object.entries(analysis.structure.keyTypes).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{type}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-zinc-800 rounded-full h-2">
                                  <div
                                    className="bg-red-600 h-2 rounded-full"
                                    style={{
                                      width: `${(count / analysis.structure.totalKeys) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-zinc-400">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="schema" className="space-y-4">
            {analysis && analysis.schema && (
              <Card>
                <CardHeader>
                  <CardTitle>Inferred Schema</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-zinc-900 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                    <code>{JSON.stringify(analysis.schema, null, 2)}</code>
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {analysis && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.insights.map((insight, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-900/50 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <span className="text-sm text-zinc-300">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="flex-shrink-0 text-green-400">✓</span>
                          <span className="text-sm text-zinc-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
