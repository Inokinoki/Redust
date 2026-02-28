import { useState, useEffect, useMemo } from "react";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const categories = useMemo(() => {
    const cats = new Set(commands.map((c) => c.category));
    return Array.from(cats).sort();
  }, [commands]);

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(searchLower) ||
        (c.description && c.description.toLowerCase().includes(searchLower))
    );
  }, [commands, search]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          selected.action();
          onClose();
          setSearch("");
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  const selectedCommand = filteredCommands[selectedIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-24">
      <Card className="w-full max-w-2xl overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <div className="flex items-center border-b border-zinc-800 p-4">
            <span className="mr-3 text-xl">🔍</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="border-none bg-transparent text-lg focus-visible:ring-0"
              autoFocus
            />
            <div className="ml-4 flex gap-2 text-xs text-zinc-500">
              <kbd className="rounded border border-zinc-700 px-2 py-1">↑↓</kbd>
              <span>to navigate</span>
              <kbd className="ml-2 rounded border border-zinc-700 px-2 py-1">↵</kbd>
              <span>to select</span>
              <kbd className="ml-2 rounded border border-zinc-700 px-2 py-1">esc</kbd>
              <span>to close</span>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                No commands found matching "{search}"
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {categories.map((category) => {
                  const categoryCommands = filteredCommands.filter((c) => c.category === category);
                  if (categoryCommands.length === 0) return null;

                  return (
                    <div key={category}>
                      <div className="bg-zinc-900/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        {category}
                      </div>
                      {categoryCommands.map((command) => (
                        <button
                          key={command.id}
                          onClick={() => {
                            command.action();
                            onClose();
                            setSearch("");
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                            selectedCommand?.id === command.id
                              ? "bg-zinc-800 text-zinc-100"
                              : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {command.icon && <span className="text-lg">{command.icon}</span>}
                            <div>
                              <div className="font-medium text-zinc-200">{command.label}</div>
                              {command.description && (
                                <div className="text-xs text-zinc-500">{command.description}</div>
                              )}
                            </div>
                          </div>
                          {command.shortcut && (
                            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-500">
                              {command.shortcut}
                            </kbd>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
