import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";

export function ImportExport({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [keyPattern, setKeyPattern] = useState("*");

  const handleExport = () => {
    alert("Import/Export functionality requires Tauri plugins to be installed.");
    // TODO: Implement with @tauri-apps/plugin-dialog when available
  };

  const handleImport = () => {
    alert("Import/Export functionality requires Tauri plugins to be installed.");
    // TODO: Implement with @tauri-apps/plugin-dialog and @tauri-apps/plugin-fs when available
  };

  const handleDelete = () => {
    alert("Import/Export functionality requires Tauri plugins to be installed.");
    // TODO: Implement with @tauri-apps/plugin-dialog when available
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 w-full max-w-4xl rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Import / Export</h2>

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
              <Button onClick={handleExport} className="w-full">
                Export to JSON
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-4 text-lg font-medium">Import</h3>
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Import keys from a JSON file that was exported from Redis.
              </p>
              <Button onClick={handleImport} variant="outline" className="w-full">
                Import from JSON
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-4 text-lg font-medium text-red-400">Danger Zone</h3>
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Delete all keys matching pattern. This action cannot be undone!
              </p>
              <Button
                onClick={handleDelete}
                disabled={!keyPattern.trim()}
                variant="destructive"
                className="w-full"
              >
                Delete Keys
              </Button>
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
