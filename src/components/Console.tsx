import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useConnectionStore } from "../stores";
import { deleteKey } from "../lib/api";
import type { KeyInfo } from "../types";

interface ConsoleOutput {
  type: "command" | "output" | "error";
  text: string;
  timestamp: Date;
}

export function Console() {
  const activeConnection = useConnectionStore((state) => state.getActiveConnection());
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<ConsoleOutput[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const handleExecute = async (cmd: string) => {
    if (!cmd.trim() || !activeConnection) return;

    setOutput((prev) => [...prev, { type: "command", text: cmd, timestamp: new Date() }]);

    // Add to history
    setHistory((prev) => {
      const newHistory = [...prev.filter((h) => h !== cmd), cmd];
      setHistoryIndex(newHistory.length);
      return newHistory;
    });

    // Simple command parsing
    const parts = cmd.trim().split(/\s+/);
    const redisCmd = parts[0]?.toUpperCase();

    try {
      if (redisCmd === "DEL" && parts[1]) {
        const deleted = await deleteKey(activeConnection, parts[1]);
        setOutput((prev) => [
          ...prev,
          {
            type: "output",
            text: deleted ? `(integer) 1` : `(integer) 0`,
            timestamp: new Date(),
          },
        ]);
      } else if (redisCmd === "HELP") {
        setOutput((prev) => [
          ...prev,
          {
            type: "output",
            text: `Available commands:\nDEL <key>  - Delete a key\nHELP         - Show this help\n<key>       - View key details`,
            timestamp: new Date(),
          },
        ]);
      } else {
        // Treat as key name - try to get key info
        setOutput((prev) => [
          ...prev,
          {
            type: "output",
            text: `Command '${redisCmd}' not yet implemented. Use HELP for available commands.`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      setOutput((prev) => [
        ...prev,
        { type: "error", text: String(error), timestamp: new Date() },
      ]);
    }

    setCommand("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleExecute(command);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
        setCommand(history[historyIndex - 1]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        setHistoryIndex(historyIndex + 1);
        setCommand(history[historyIndex + 1]);
      } else if (historyIndex >= history.length - 1) {
        setHistoryIndex(history.length);
        setCommand("");
      }
    }
  };

  if (!activeConnection) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        <p>Connect to a Redis instance to use the console</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-4 text-xl font-semibold">CLI Console</h2>
      <div className="flex flex-1 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm">
        {output.length === 0 ? (
          <p className="text-zinc-500">Type HELP for available commands</p>
        ) : (
          output.map((line, idx) => (
            <div key={idx} className="mb-2">
              <span className={line.type === "error" ? "text-red-400" : ""}>
                {line.type === "command" ? "> " : ""}
                {line.text}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <div className="mt-4 flex space-x-2">
        <span className="text-green-400">redis&gt;</span>
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Redis command..."
          className="flex-1 font-mono"
          disabled={!activeConnection}
        />
        <Button onClick={() => handleExecute(command)} disabled={!activeConnection}>
          Execute
        </Button>
      </div>
    </div>
  );
}
