import { useState, useEffect } from "react";
import { ConnectionManager } from "./components/ConnectionManager";
import { ConnectionList } from "./components/ConnectionList";
import { KeyBrowser } from "./components/KeyBrowser";
import { ValueEditor } from "./components/ValueEditor";
import { ImportExport } from "./components/ImportExport";
import { LuaScriptEditor } from "./components/LuaScriptEditor";
import { CommandPalette } from "./components/CommandPalette";
import { SplitPane, SplitButton } from "./components/SplitPane";
import { ThemeToggle } from "./components/ThemeToggle";
import { DashboardLayout } from "./components/Dashboard/DashboardLayout";
import { useCommandPalette } from "./stores/commandPaletteStore";
import { useSplitPaneStore } from "./stores/splitPaneStore";
import { useDashboardStore } from "./stores/dashboardStore";
import { Command } from "./stores/commandPaletteStore";
import { Button } from "./components/ui/button";
import "./index.css";

function App() {
  // Modal-only states (for components that remain as modals)
  const [showImportExport, setShowImportExport] = useState(false);
  const [showLuaEditor, setShowLuaEditor] = useState(false);
  const [showConnectionManager, setShowConnectionManager] = useState(false);
  const [selectedKey, setSelectedKey] = useState<{
    key: string;
    type: string;
  } | null>(null);

  const { isOpen, open, close } = useCommandPalette();
  const { splitMode, setLeftKey, setRightKey } = useSplitPaneStore();

  const handleKeyClick = (key: string, type: string) => {
    if (splitMode === "none") {
      setSelectedKey({ key, type });
    } else {
      if (!useSplitPaneStore.getState().leftKey) {
        setLeftKey({ key, type });
      } else if (!useSplitPaneStore.getState().rightKey) {
        setRightKey({ key, type });
      } else {
        setSelectedKey({ key, type });
      }
    }
  };

  const handleRightClick = (key: string, type: string) => {
    setRightKey({ key, type });
  };

  // Helper to open panels
  const openPanel = (panelId: string) => {
    useDashboardStore.getState().setPanelVisible(panelId, true);
  };

  const commands: Command[] = [
    {
      id: "add-connection",
      label: "Add Connection",
      description: "Add a new Redis connection",
      icon: "➕",
      shortcut: "Cmd+Shift+N",
      category: "Connection",
      action: () => setShowConnectionManager(true),
    },
    {
      id: "search-vectors",
      label: "Search Vectors",
      description: "Perform vector similarity search",
      icon: "🔍",
      shortcut: "Cmd+Shift+V",
      category: "AI Features",
      action: () => openPanel("vectorSearch"),
    },
    {
      id: "embedding-cache",
      label: "Embedding Cache",
      description: "Manage embedding cache",
      icon: "📦",
      shortcut: "Cmd+Shift+E",
      category: "AI Features",
      action: () => openPanel("embeddingCache"),
    },
    {
      id: "cluster-visualization",
      label: "Cluster Visualization",
      description: "Visualize embedding clusters",
      icon: "🎯",
      shortcut: "Cmd+Shift+D",
      category: "AI Features",
      action: () => openPanel("clusterVis"),
    },
    {
      id: "llm-chat",
      label: "AI Chat (RAG)",
      description: "Chat with LLM using RAG",
      icon: "🤖",
      shortcut: "Cmd+Shift+A",
      category: "AI Features",
      action: () => openPanel("llmChat"),
    },
    {
      id: "monitoring",
      label: "Monitoring Dashboard",
      description: "View real-time Redis metrics",
      icon: "📊",
      shortcut: "Cmd+Shift+M",
      category: "Monitoring",
      action: () => openPanel("monitoring"),
    },
    {
      id: "cluster",
      label: "Cluster Topology",
      description: "View Redis cluster topology",
      icon: "🔗",
      shortcut: "Cmd+Shift+C",
      category: "Monitoring",
      action: () => openPanel("cluster"),
    },
    {
      id: "pubsub",
      label: "Pub/Sub Monitor",
      description: "Monitor and publish messages",
      icon: "📡",
      shortcut: "Cmd+Shift+P",
      category: "Monitoring",
      action: () => openPanel("pubsub"),
    },
    {
      id: "query-optimizer",
      label: "Query Optimizer",
      description: "Optimize Redis queries with AI",
      icon: "⚡",
      shortcut: "Cmd+Shift+Q",
      category: "AI Features",
      action: () => openPanel("queryOptimizer"),
    },
    {
      id: "import-export",
      label: "Import / Export",
      description: "Import or export Redis data",
      icon: "📥",
      shortcut: "Cmd+Shift+I",
      category: "Advanced",
      action: () => setShowImportExport(true),
    },
    {
      id: "lua-editor",
      label: "Lua Script Editor",
      description: "Write and execute Lua scripts",
      icon: "📝",
      shortcut: "Cmd+Shift+L",
      category: "Advanced",
      action: () => setShowLuaEditor(true),
    },
    {
      id: "split-view",
      label: "Split View",
      description: "Open split pane for key comparison",
      icon: "⚡",
      shortcut: "Cmd+Shift+S",
      category: "Navigation",
      action: () => useSplitPaneStore.getState().setSplitMode("horizontal"),
    },
    {
      id: "focus-search",
      label: "Focus Key Search",
      description: "Jump to key search bar",
      icon: "⌘",
      shortcut: "Cmd+K",
      category: "Navigation",
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search keys"]');
        if (searchInput instanceof HTMLInputElement) {
          searchInput.focus();
        }
      },
    },
    {
      id: "refresh-keys",
      label: "Refresh Keys",
      description: "Reload key list",
      icon: "🔄",
      shortcut: "Cmd+R",
      category: "Key Operations",
      action: () => window.location.reload(),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Connection Manager: Cmd/Ctrl + Shift + N
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        setShowConnectionManager(true);
      }

      // Command Palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open();
      }

      // Split View: Cmd/Ctrl + Shift + S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        const currentMode = useSplitPaneStore.getState().splitMode;
        if (currentMode === "none") {
          useSplitPaneStore.getState().setSplitMode("horizontal");
        } else {
          useSplitPaneStore.getState().resetSplit();
        }
      }

      // Panel shortcuts - use dashboard store
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        switch (e.key.toUpperCase()) {
          case "V":
            e.preventDefault();
            openPanel("vectorSearch");
            break;
          case "E":
            e.preventDefault();
            openPanel("embeddingCache");
            break;
          case "A":
            e.preventDefault();
            openPanel("llmChat");
            break;
          case "M":
            e.preventDefault();
            openPanel("monitoring");
            break;
          case "C":
            e.preventDefault();
            openPanel("cluster");
            break;
          case "P":
            e.preventDefault();
            openPanel("pubsub");
            break;
          case "D":
            e.preventDefault();
            openPanel("clusterVis");
            break;
          case "Q":
            e.preventDefault();
            openPanel("queryOptimizer");
            break;
          case "I":
            e.preventDefault();
            setShowImportExport(true);
            break;
          case "L":
            e.preventDefault();
            setShowLuaEditor(true);
            break;
        }
      }

      // Close dialogs: Escape
      if (e.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-red-500">Redust</h1>
            <span className="text-sm text-zinc-400">v0.1.0</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => setShowConnectionManager(true)}>
              + Add Connection
            </Button>
            <SplitButton />
            <Button variant="ghost" onClick={open}>
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                ⌘K
              </kbd>
            </Button>
          </div>
        </div>
      </header>

      <DashboardLayout>
        {/* Main content: Connection List + Key Browser */}
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ConnectionList />
          </div>
          <div className="lg:col-span-2">
            <KeyBrowser onKeyClick={handleKeyClick} onRightClick={handleRightClick} />
          </div>
        </div>
      </DashboardLayout>

      {/* Modal Components (remain as modals for focused tasks) */}
      <ImportExport isOpen={showImportExport} onClose={() => setShowImportExport(false)} />
      <LuaScriptEditor isOpen={showLuaEditor} onClose={() => setShowLuaEditor(false)} />

      <CommandPalette isOpen={isOpen} onClose={close} commands={commands} />

      <ConnectionManager
        isOpen={showConnectionManager}
        onClose={() => setShowConnectionManager(false)}
      />

      <SplitPane />

      {selectedKey && (
        <ValueEditor
          isOpen={!!selectedKey}
          key={selectedKey.key}
          keyType={selectedKey.type}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </div>
  );
}

export default App;
