import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useConnectionStore } from "../stores/connectionStore";

interface ClusterNode {
  id: string;
  role: string;
  host: string;
  port: number;
  master_id: string | null;
  connected: boolean;
  slots: string | null;
}

interface ClusterInfo {
  cluster_enabled: boolean;
  cluster_state: string;
  known_nodes: number;
  nodes: ClusterNode[];
}

export function ClusterTopology({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const getActiveConnection = useConnectionStore((state) => state.getActiveConnection);
  const [loading, setLoading] = useState(true);
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadClusterInfo = async () => {
    const config = getActiveConnection();
    if (!config) {
      setError("No active connection");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await invoke<ClusterInfo>("getClusterInfo", { config });
      setClusterInfo(result);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadClusterInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Cluster Topology</h2>
          <Button onClick={loadClusterInfo} disabled={loading} variant="outline">
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-950 p-4 text-red-400">
            {error}
          </div>
        )}

        {clusterInfo && !clusterInfo.cluster_enabled && (
          <div className="mb-4 rounded-lg border border-yellow-800 bg-yellow-950 p-4 text-yellow-400">
            <p className="font-medium">Cluster mode is not enabled</p>
            <p className="mt-2 text-sm text-yellow-500">
              This Redis instance is running in standalone mode. To use cluster features, enable
              cluster mode in your Redis configuration.
            </p>
          </div>
        )}

        {clusterInfo && clusterInfo.cluster_enabled && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-400">Cluster State</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    {clusterInfo.cluster_state}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-400">Known Nodes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">{clusterInfo.known_nodes}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-400">Cluster Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">
                    {clusterInfo.cluster_state === "ok" ? "Healthy" : "Degraded"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Cluster Nodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clusterInfo.nodes.map((node) => (
                    <div
                      key={node.id}
                      className={`rounded-lg border p-4 ${
                        node.role === "master"
                          ? "border-blue-800 bg-blue-950"
                          : "border-zinc-800 bg-zinc-950"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-2 w-2 rounded-full bg-green-400" />
                          <span className="font-semibold text-zinc-200">
                            {node.role.toUpperCase()}
                          </span>
                          <span className="text-sm text-zinc-500">ID: {node.id}</span>
                        </div>
                        <span
                          className={`rounded px-2 py-1 text-xs ${
                            node.connected
                              ? "bg-green-900 text-green-300"
                              : "bg-red-900 text-red-300"
                          }`}
                        >
                          {node.connected ? "Connected" : "Disconnected"}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Address:</span>
                          <span className="text-zinc-300">
                            {node.host}:{node.port}
                          </span>
                        </div>
                        {node.master_id && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Master ID:</span>
                            <span className="text-zinc-300">{node.master_id}</span>
                          </div>
                        )}
                        {node.slots && node.role === "master" && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Slots:</span>
                            <span className="text-zinc-300">
                              {node.slots.length > 50
                                ? `${node.slots.substring(0, 50)}...`
                                : node.slots}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
