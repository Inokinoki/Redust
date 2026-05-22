import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent } from "../ui/card";
import { useConnectionStore } from "../../stores/connectionStore";

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

interface MetricsBarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function MetricsBar({ collapsed, onToggle }: MetricsBarProps) {
  const getActiveConnection = useConnectionStore((state) => state.getActiveConnection);
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    const config = getActiveConnection();
    if (!config) return;

    try {
      const result = await invoke<MonitoringData>("getMonitoringData", { config });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch monitoring data:", error);
    } finally {
      setLoading(false);
    }
  }, [getActiveConnection]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  if (collapsed) {
    return (
      <div className="flex w-16 flex-col items-center border-l border-zinc-200 bg-zinc-50 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <button
          onClick={onToggle}
          className="mb-4 flex h-10 w-10 items-center justify-center rounded text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          title="Expand metrics"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>

        <div className="flex flex-col gap-3">
          <MetricIcon
            label="CPU"
            value={data?.cpu ? `${data.cpu.toFixed(0)}%` : "--"}
            color={getCpuColor(data?.cpu || 0)}
          />
          <MetricIcon
            label="Memory"
            value={data?.usedMemory ? formatBytes(data.usedMemory) : "--"}
            color="text-yellow-400"
          />
          <MetricIcon
            label="Keys"
            value={data?.keys ? formatNumber(data.keys) : "--"}
            color="text-red-400"
          />
          <MetricIcon
            label="Ops/s"
            value={data?.commandsPerSecond ? formatNumber(data.commandsPerSecond) : "--"}
            color="text-purple-400"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-72 flex-col border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Metrics</h2>
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          title="Collapse metrics"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Metrics Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-500">Loading...</div>
        ) : !data ? (
          <div className="text-center text-sm text-zinc-500 dark:text-zinc-500">No connection</div>
        ) : (
          <div className="space-y-3">
            {/* CPU */}
            <MetricCard
              label="CPU Usage"
              value={`${data.cpu.toFixed(1)}%`}
              color={getCpuColor(data.cpu)}
              icon="⚡"
            />

            {/* Memory */}
            <MetricCard
              label="Memory"
              value={formatBytes(data.usedMemory)}
              subValue={data.memory > 0 ? `${data.memory.toFixed(1)}% used` : undefined}
              color="text-yellow-400"
              icon="💾"
            />

            {/* Keys */}
            <MetricCard
              label="Total Keys"
              value={formatNumber(data.keys)}
              color="text-red-400"
              icon="🔑"
            />

            {/* Commands/sec */}
            <MetricCard
              label="Commands/sec"
              value={data.commandsPerSecond.toFixed(0)}
              color="text-purple-400"
              icon="📈"
            />

            {/* Connections */}
            <MetricCard
              label="Connections"
              value={data.connections.toString()}
              color="text-blue-400"
              icon="🔗"
            />

            {/* Server Info */}
            <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-500">Redis Version</span>
                <span className="text-zinc-800 dark:text-zinc-300">{data.redisVersion}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-500">Uptime</span>
                <span className="text-zinc-800 dark:text-zinc-300">{formatUptime(data.uptime)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-500">Last Updated</span>
                <span className="text-zinc-600 dark:text-zinc-400">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  color: string;
  icon: string;
}

function MetricCard({ label, value, subValue, color, icon }: MetricCardProps) {
  return (
    <Card className="border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/50">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-zinc-500 dark:text-zinc-500">{label}</div>
            <div className={`text-lg font-bold ${color}`}>{value}</div>
            {subValue && <div className="text-xs text-zinc-500 dark:text-zinc-500">{subValue}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricIcon({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center" title={label}>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-500">{label.substring(0, 3)}</div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function getCpuColor(cpu: number): string {
  if (cpu >= 80) return "text-red-400";
  if (cpu >= 50) return "text-yellow-400";
  return "text-green-400";
}
