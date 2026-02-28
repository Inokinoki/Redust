import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { useConnectionStore } from "../stores/connectionStore";

interface ScriptExecutionResult {
  result: string;
  success: boolean;
  error?: string;
}

export function LuaScriptEditor({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const getActiveConnection = useConnectionStore((state) => state.getActiveConnection);
  const [script, setScript] = useState("");
  const [keys, setKeys] = useState("");
  const [args, setArgs] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedScripts, setSavedScripts] = useState<Record<string, string>>({});
  const [selectedScript, setSelectedScript] = useState<string | null>(null);

  const exampleScripts = [
    {
      name: "Increment Counter",
      script: `local counter = redis.call("GET", "counter")
if not counter then 
  redis.call("SET", "counter", "1")
  return 1
end
return redis.call("INCR", "counter")`,
      keys: "counter",
      args: "",
    },
    {
      name: "Rate Limiter",
      script: `local key = KEYS[1]
local limit = tonumber(ARGV[1])
local current = tonumber(redis.call("GET", key) or "0")

if current >= limit then
  return {err = "Rate limit exceeded"}
end

redis.call("INCR", key)
redis.call("EXPIRE", key, 60)
return {current = current + 1, limit = limit}`,
      keys: "rate_limit:user:123",
      args: "10",
    },
    {
      name: "Bulk Delete",
      script: `local pattern = ARGV[1]
local deleted = 0
for i, key in ipairs(redis.call("KEYS", pattern)) do
  redis.call("DEL", key)
  deleted = deleted + 1
end
return deleted`,
      keys: "",
      args: "temp:*",
    },
  ];

  const handleLoadExample = (example: (typeof exampleScripts)[0]) => {
    setScript(example.script);
    setKeys(example.keys);
    setArgs(example.args);
    setSelectedScript(null);
  };

  const handleSaveScript = () => {
    if (!script.trim()) {
      alert("Please enter a script to save");
      return;
    }

    const name = prompt("Enter a name for this script:");
    if (name) {
      setSavedScripts((prev) => ({ ...prev, [name]: script }));
      alert(`Script saved as "${name}"`);
    }
  };

  const handleLoadSaved = (name: string) => {
    const savedScript = savedScripts[name];
    if (savedScript) {
      setScript(savedScript);
      setSelectedScript(name);
    }
  };

  const handleRunScript = async () => {
    const config = getActiveConnection();
    if (!config) {
      alert("No active connection");
      return;
    }

    if (!script.trim()) {
      alert("Please enter a script");
      return;
    }

    setLoading(true);
    setOutput("");

    try {
      const result = await invoke<ScriptExecutionResult>("executeLuaScript", {
        config,
        request: {
          script,
          keys: keys ? keys.split(",").map((k) => k.trim()) : [],
          args: args ? args.split(",").map((a) => a.trim()) : [],
        },
      });

      if (result.success) {
        setOutput(result.result);
      } else {
        setOutput(`Error: ${result.error}`);
      }
    } catch (err) {
      setOutput(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setScript("");
    setKeys("");
    setArgs("");
    setOutput("");
    setSelectedScript(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 flex h-[600px] w-full max-w-7xl flex-col rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lua Script Editor</h2>
          <div className="flex gap-2">
            <Button onClick={handleClear} variant="outline" size="sm">
              Clear
            </Button>
            <Button onClick={onClose} size="sm">
              Close
            </Button>
          </div>
        </div>

        <div className="flex flex-1 gap-6 overflow-hidden">
          <div className="flex w-1/4 flex-col gap-4 overflow-y-auto">
            <Card className="p-4">
              <h3 className="mb-4 text-lg font-medium">Example Scripts</h3>
              <div className="space-y-2">
                {exampleScripts.map((example) => (
                  <button
                    key={example.name}
                    onClick={() => handleLoadExample(example)}
                    className="w-full rounded border border-zinc-800 p-2 text-left text-sm text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    {example.name}
                  </button>
                ))}
              </div>
            </Card>

            {Object.keys(savedScripts).length > 0 && (
              <Card className="p-4">
                <h3 className="mb-4 text-lg font-medium">Saved Scripts</h3>
                <div className="space-y-2">
                  {Object.entries(savedScripts).map(([name]) => (
                    <button
                      key={name}
                      onClick={() => handleLoadSaved(name)}
                      className="w-full rounded border border-zinc-800 p-2 text-left text-sm text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <Card className="flex flex-1 flex-col p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-medium">Script</h3>
                <Button onClick={handleSaveScript} variant="outline" size="sm">
                  Save Script
                </Button>
              </div>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Enter your Lua script here..."
                className="flex-1 rounded border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm text-zinc-300 focus:border-zinc-700 focus:outline-none"
                spellCheck={false}
              />
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="mb-4 text-lg font-medium">Keys (comma-separated)</h3>
                <Input
                  value={keys}
                  onChange={(e) => setKeys(e.target.value)}
                  placeholder="key1, key2, key3"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  These will be passed to KEYS array in Lua
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="mb-4 text-lg font-medium">Arguments (comma-separated)</h3>
                <Input
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                  placeholder="arg1, arg2, arg3"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  These will be passed to ARGV array in Lua
                </p>
              </Card>
            </div>

            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-medium">Output</h3>
                <Button onClick={handleRunScript} disabled={loading}>
                  {loading ? "Running..." : "Run Script"}
                </Button>
              </div>
              <div
                className={`rounded border p-4 font-mono text-sm ${
                  output.startsWith("Error")
                    ? "border-red-800 bg-red-950 text-red-300"
                    : "border-zinc-800 bg-zinc-950 text-zinc-300"
                }`}
              >
                {output || "Run the script to see output..."}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
