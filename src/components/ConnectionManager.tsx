import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "./ui/dialog";
import { useConnectionStore } from "../stores";
import type { ConnectionConfig } from "../types";

interface ConnectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionManager({ isOpen, onClose }: ConnectionManagerProps) {
  const { addConnection } = useConnectionStore();
  const [name, setName] = useState("");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(6379);
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState(0);
  const [tls, setTls] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newConnection: ConnectionConfig = {
      id: crypto.randomUUID(),
      name: name || `${host}:${port}`,
      host,
      port,
      password: password || undefined,
      database: database === 0 ? undefined : database,
      tls,
    };

    addConnection(newConnection);

    // Reset form
    setName("");
    setHost("localhost");
    setPort(6379);
    setPassword("");
    setDatabase(0);
    setTls(false);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen}>
      <DialogHeader>
        <DialogTitle>Add Redis Connection</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              placeholder="My Redis Instance"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                placeholder="localhost"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                min={1}
                max={65535}
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password (Optional)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Redis password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Database (Optional, 0-15)</Label>
            <Input
              id="database"
              type="number"
              min={0}
              max={15}
              value={database}
              onChange={(e) => setDatabase(parseInt(e.target.value))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="tls"
              checked={tls}
              onChange={(e) => setTls(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
            />
            <Label htmlFor="tls" className="cursor-pointer">
              Use TLS/SSL
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Connection</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
