import { useState, useEffect, useCallback } from "react";
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

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
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

interface MonitoringDashboardProps {
  variant?: "panel" | "modal" | "page";
  isOpen?: boolean;
  onClose?: () => void;
}

export function MonitoringDashboard({ variant = "modal", isOpen = true, onClose }: MonitoringDashboardProps) {
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

  const refreshData = useCallback(async () => {
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
  }, [getActiveConnection]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const content = (
    <div className="h-full overflow-auto p-4">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-green-600 dark:text-green-400">{data.cpu.toFixed(1)}%</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">CPU Usage</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatBytes(data.usedMemory)}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {data.memory > 0 ? `${data.memory.toFixed(1)}%` : "0%"} Used
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-red-600 dark:text-red-400">
                {data.keys.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Keys</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{data.connections}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Connections</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                {data.commandsPerSecond.toFixed(0)}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Commands/sec</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="mb-4 text-lg font-medium">Server Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-sm text-zinc-500">Redis Version</div>
            <div className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">{data.redisVersion}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-sm text-zinc-500">Uptime</div>
            <div className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">{formatUptime(data.uptime)}</div>
          </div>
        </div>

        <h3 className="mb-4 mt-6 text-lg font-medium">Operations History</h3>
        <div className="h-48 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Commands/sec</span>
              <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">{data.commandsPerSecond}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Connected Clients</span>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">{data.connections}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Total Keys</span>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">{data.keys.toLocaleString()}</span>
            </div>
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
    </div>
  );

  // Compact panel layout for bottom panel (320px)
  if (variant === "panel") {
    return (
      <div className="flex h-full flex-col overflow-auto p-2 text-sm">
        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 pb-2">
          <div className="rounded border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">{data.cpu.toFixed(1)}%</div>
            <div className="text-xs text-zinc-500">CPU</div>
          </div>
          <div className="rounded border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{formatBytes(data.usedMemory)}</div>
            <div className="text-xs text-zinc-500">Memory</div>
          </div>
          <div className="rounded border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">{data.keys.toLocaleString()}</div>
            <div className="text-xs text-zinc-500">Keys</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pb-2">
          <div className="rounded border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.connections}</div>
            <div className="text-xs text-zinc-500">Clients</div>
          </div>
          <div className="rounded border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{data.commandsPerSecond.toFixed(0)}</div>
            <div className="text-xs text-zinc-500">Cmds/sec</div>
          </div>
          <div className="rounded border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{data.memory.toFixed(0)}%</div>
            <div className="text-xs text-zinc-500">Mem%</div>
          </div>
        </div>

        {/* Server info row */}
        <div className="flex gap-2 rounded border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex-1">
            <span className="text-xs text-zinc-500">Version</span>{" "}
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{data.redisVersion}</span>
          </div>
          <div className="flex-1">
            <span className="text-xs text-zinc-500">Uptime</span>{" "}
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{formatUptime(data.uptime)}</span>
          </div>
        </div>

        {/* Refresh bar */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-500">Updated: {new Date().toLocaleTimeString()}</span>
          <Button onClick={refreshData} disabled={refreshing} variant="ghost" size="sm" className="h-6 px-2 text-xs">
            {refreshing ? "..." : "Refresh"}
          </Button>
        </div>
      </div>
    );
  }

  // Page variant (inline, no overlay)
  if (variant === "page") return <div className="h-full overflow-auto p-6">{content}</div>;

  // Modal variant (fallback)
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 w-full max-w-6xl rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Real-time Monitoring</h2>
          <Button onClick={onClose} variant="outline" size="sm">Close</Button>
        </div>
        {content}
      </div>
    </div>
  );
}
