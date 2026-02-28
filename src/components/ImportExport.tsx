import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { useConnectionStore } from "../stores/connectionStore";
import type { ConnectionConfig } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";

interface KeyValue {
  key: string;
  type: string;
  value: string;
  ttl?: number | null;
}

export function ImportExport({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const getActiveConnection = useConnectionStore((state) => state.getActiveConnection);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [keyPattern, setKeyPattern] = useState("*");
  const [exportCount, setExportCount] = useState<number | null>(null);
  const [importCount, setImportCount] = useState<number | null>(null);
  const [deleteCount, setDeleteCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    const config = getActiveConnection();
    if (!config) {
      setError("No active connection");
      return;
    }

    if (!keyPattern.trim()) {
      setError("Please enter a key pattern");
      return;
    }

    setExporting(true);
    setExportCount(null);
    setError(null);

    try {
      const data = await invoke<KeyValue[]>("exportKeys", {
        config,
        pattern: keyPattern,
      });

      setExportCount(data.length);

      if (data.length === 0) {
        setError("No keys found matching the pattern");
        setExporting(false);
        return;
      }

      // Save to file
      const filePath = await save({
        defaultPath: `redis-export-${Date.now()}.json`,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (filePath) {
        await writeTextFile(filePath, JSON.stringify(data, null, 2));
        alert(`Successfully exported ${data.length} keys to ${filePath}`);
      }
    } catch (err) {
      setError(err as string);
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    const config = getActiveConnection();
    if (!config) {
      setError("No active connection");
      return;
    }

    setImporting(true);
    setImportCount(null);
    setError(null);

    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (!filePath) {
        setImporting(false);
        return;
      }

      const content = await readTextFile(filePath);
      const data: KeyValue[] = JSON.parse(content);

      const imported = await invoke<number>("importKeys", {
        config,
        data,
      });

      setImportCount(imported);
      alert(`Successfully imported ${imported} keys from ${filePath}`);
    } catch (err) {
      setError(err as string);
      console.error("Import failed:", err);
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    const config = getActiveConnection();
    if (!config) {
      setError("No active connection");
      return;
    }

    if (!keyPattern.trim()) {
      setError("Please enter a key pattern");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete all keys matching "${keyPattern}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const deleted = await invoke<number>("deleteKeysByPattern", {
        config,
        pattern: keyPattern,
      });

      setDeleteCount(deleted);
      alert(`Successfully deleted ${deleted} keys matching "${keyPattern}"`);
    } catch (err) {
      setError(err as string);
      console.error("Delete failed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 w-full max-w-4xl rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Import / Export</h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-950 p-4 text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6 space-y-4">
          <div>
            <Label htmlFor="key-pattern">Key Pattern</Label>
            <Input
              id="key-pattern"
              value={keyPattern}
              onChange={(e) => setKeyPattern(e.target.value)}
              placeholder="* (matches all keys)"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Use * as wildcard. Examples: user:*, cache:*, temp:*
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-4">
            <h3 className="mb-4 text-lg font-medium">Export</h3>
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Export keys matching the pattern to a JSON file.
              </p>
              <Button
                onClick={handleExport}
                disabled={exporting || !keyPattern.trim()}
                className="w-full"
              >
                {exporting ? "Exporting..." : "Export to JSON"}
              </Button>
              {exportCount !== null && (
                <div className="text-sm text-green-400">Exported {exportCount} keys</div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-4 text-lg font-medium">Import</h3>
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Import keys from a JSON file that was exported from Redis.
              </p>
              <Button
                onClick={handleImport}
                disabled={importing}
                variant="outline"
                className="w-full"
              >
                {importing ? "Importing..." : "Import from JSON"}
              </Button>
              {importCount !== null && (
                <div className="text-sm text-green-400">Imported {importCount} keys</div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-4 text-lg font-medium text-red-400">Danger Zone</h3>
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Delete all keys matching the pattern. This action cannot be undone!
              </p>
              <Button
                onClick={handleDelete}
                disabled={!keyPattern.trim()}
                variant="destructive"
                className="w-full"
              >
                Delete Keys
              </Button>
              {deleteCount !== null && (
                <div className="text-sm text-red-400">Deleted {deleteCount} keys</div>
              )}
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
