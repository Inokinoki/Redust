import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useConnectionStore } from "../stores";
import { testConnection } from "../lib/api";
import type { ConnectionConfig } from "../types";

export function ConnectionList() {
  const { connections, activeConnectionId, setActiveConnection, deleteConnection } =
    useConnectionStore();
  const [testing, setTesting] = useState<string | null>(null);

  const handleTestConnection = async (config: ConnectionConfig) => {
    setTesting(config.id);
    try {
      const result = await testConnection(config);
      alert(`Connection successful: ${result}`);
    } catch (error) {
      alert(`Connection failed: ${error}`);
    }
    setTesting(null);
  };

  const handleDeleteConnection = (id: string) => {
    if (window.confirm("Are you sure you want to delete this connection?")) {
      deleteConnection(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Connections</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {connections.length} connection
          {connections.length !== 1 ? "s" : ""}
        </p>
      </div>

      {connections.length === 0 ? (
        <Card className="p-6 text-center text-zinc-600 dark:text-zinc-400">
          <p>No connections yet. Click "Add Connection" to get started.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => (
            <Card
              key={conn.id}
              className={`p-4 transition-colors ${
                activeConnectionId === conn.id
                  ? "border-red-600 bg-zinc-100 dark:bg-zinc-900"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{conn.name}</h3>
                  <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                    {conn.host}:{conn.port}
                    {conn.database !== undefined && ` [db${conn.database}]`}
                    {conn.tls && " 🔒"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTestConnection(conn)}
                    disabled={testing === conn.id}
                    className="h-7 px-2 text-xs"
                  >
                    {testing === conn.id ? "..." : "Test"}
                  </Button>
                  <Button
                    size="sm"
                    variant={activeConnectionId === conn.id ? "default" : "outline"}
                    onClick={() => setActiveConnection(conn.id)}
                    className="h-7 px-2 text-xs"
                  >
                    {activeConnectionId === conn.id ? "Active" : "Connect"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteConnection(conn.id)}
                    className="h-7 w-7 p-0 text-zinc-400 hover:text-red-500"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
