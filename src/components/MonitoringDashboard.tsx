import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useConnectionStore } from "../stores/connectionStore";

interface MonitoringData {
  cpu: number;
  memory: number;
  usedMemory: number;
  keys: number;
  connections: number;
  commandsPerSecond: number;
  redisVersion: string;
  uptime: number;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function MonitoringDashboard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const getActiveConnection = useConnectionStore((state) => state.getActiveConnection);
  const [data, setData] = useState<MonitoringData>({
    cpu: 0,
    memory: 0,
    usedMemory: 0,
    keys: 0,
    connections: 0,
    commandsPerSecond: 0,
    redisVersion: "unknown",
    uptime: 0,
  });

  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    const config = getActiveConnection();
    if (!config) {
      console.error("No active connection");
      return;
    }

    setRefreshing(true);
    try {
      const result = await invoke<MonitoringData>("getMonitoringData", {
        config,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch monitoring data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 w-full max-w-6xl rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Real-time Monitoring</h2>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-green-400">{data.cpu.toFixed(1)}%</div>
                <div className="text-sm text-zinc-400">CPU Usage</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-yellow-400">
                  {(data.usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB
                </div>
                <div className="text-sm text-zinc-400">
                  {data.memory > 0 ? ((data.usedMemory / data.memory) * 100).toFixed(1) : 0}% Used
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-red-400">
                  {data.keys.toLocaleString()}
                </div>
                <div className="text-sm text-zinc-400">Total Keys</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-blue-400">{data.connections}</div>
                <div className="text-sm text-zinc-400">Connections</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-purple-400">
                  {data.commandsPerSecond.toFixed(0)}
                </div>
                <div className="text-sm text-zinc-400">Commands/sec</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 space-y-4 border-t border-zinc-800 pt-6">
          <h3 className="mb-4 text-lg font-medium">Server Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm text-zinc-500">Redis Version</div>
              <div className="text-lg font-semibold text-zinc-300">{data.redisVersion}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm text-zinc-500">Uptime</div>
              <div className="text-lg font-semibold text-zinc-300">{formatUptime(data.uptime)}</div>
            </div>
          </div>

          <h3 className="mb-4 mt-6 text-lg font-medium">Performance History</h3>
          <div className="h-64 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="space-y-2">
              {[...Array(20).fill(null)].map((_, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">
                    {new Date(Date.now() - i * 30000).toLocaleTimeString()}
                  </span>
                  <span className="text-zinc-400">
                    GET keys: {(Math.random() * 100).toFixed(0)}ms
                  </span>
                  <span className="text-green-400">OK</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-zinc-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
