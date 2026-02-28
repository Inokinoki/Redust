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
        <p className="text-sm text-zinc-400">
          {connections.length} connection
          {connections.length !== 1 ? "s" : ""}
        </p>
      </div>

      {connections.length === 0 ? (
        <Card className="p-6 text-center text-zinc-400">
          <p>No connections yet. Click "Add Connection" to get started.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => (
            <Card
              key={conn.id}
              className={`p-4 transition-colors ${
                activeConnectionId === conn.id
                  ? "border-red-600 bg-zinc-900"
                  : "hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">{conn.name}</h3>
                  <p className="text-sm text-zinc-400">
                    {conn.host}:{conn.port}
                    {conn.database !== undefined && ` [db${conn.database}]`}
                    {conn.tls && " 🔒"}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTestConnection(conn)}
                    disabled={testing === conn.id}
                  >
                    {testing === conn.id ? "Testing..." : "Test"}
                  </Button>
                  <Button
                    size="sm"
                    variant={activeConnectionId === conn.id ? "default" : "outline"}
                    onClick={() => setActiveConnection(conn.id)}
                  >
                    {activeConnectionId === conn.id ? "Active" : "Connect"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteConnection(conn.id)}
                  >
                    Delete
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
