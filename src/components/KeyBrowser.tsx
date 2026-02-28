import { useState, useEffect } from "react";
import { useConnectionStore, useKeyStore } from "../stores";
import { getKeys } from "../lib/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function KeyBrowser({
  onKeyClick,
}: {
  onKeyClick?: (key: string, type: string) => void;
}) {
  const activeConnection = useConnectionStore((state) => state.getActiveConnection());
  const { keys, searchPattern, isLoading, setKeys, setSearchPattern, setIsLoading } =
    useKeyStore();
  const [debouncedPattern, setDebouncedPattern] = useState(searchPattern);

  // Debounce search pattern
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPattern(searchPattern);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchPattern]);

  // Load keys when pattern changes or connection changes
  useEffect(() => {
    if (!activeConnection) return;

    const loadKeys = async () => {
      setIsLoading(true);
      try {
        const result = await getKeys(activeConnection, debouncedPattern, 100);
        setKeys(result);
      } catch (error) {
        console.error("Failed to load keys:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadKeys();
  }, [activeConnection, debouncedPattern]);

  if (!activeConnection) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        <p>Connect to a Redis instance to view keys</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-4 mb-4">
        <h2 className="text-xl font-semibold">Keys</h2>
        <div className="flex space-x-2">
          <Input
            placeholder="Search keys (e.g., user:*, cache:*)"
            value={searchPattern}
            onChange={(e) => setSearchPattern(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => setSearchPattern("*")}>Reset</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-zinc-400">Loading keys...</p>
        </div>
      ) : keys.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-zinc-400">No keys found</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto border border-zinc-800 rounded-lg">
          <table className="w-full">
            <thead className="sticky top-0 bg-zinc-950">
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">
                  Key
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">
                  TTL
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-zinc-400">
                  Size
                </th>
              </tr>
            </thead>
            <tbody>
              {keys.map((keyInfo) => (
                <tr
                  key={keyInfo.key}
                  onClick={() => onKeyClick?.(keyInfo.key, keyInfo.type)}
                  className="border-b border-zinc-800 hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-2 text-sm font-mono">{keyInfo.key}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className="inline-flex items-center rounded-full bg-red-900/50 px-2 py-1 text-xs font-medium text-red-400">
                      {keyInfo.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-400">
                    {keyInfo.ttl === -1 ? "Persistent" : keyInfo.ttl}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-zinc-400">
                    {keyInfo.size !== undefined ? keyInfo.size.toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
