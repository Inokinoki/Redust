import { useState, useEffect } from "react";
import { ConnectionManager } from "./components/ConnectionManager";
import { ConnectionList } from "./components/ConnectionList";
import { KeyBrowser } from "./components/KeyBrowser";
import { ValueEditor } from "./components/ValueEditor";
import { ImportExport } from "./components/ImportExport";
import { LuaScriptEditor } from "./components/LuaScriptEditor";
import { CommandPalette } from "./components/CommandPalette";
import { SplitPane } from "./components/SplitPane";
import { ToastContainer } from "./components/ToastContainer";
import { TitleBar } from "./components/TitleBar";
import { DashboardLayout } from "./components/Dashboard/DashboardLayout";
import { useCommandPalette } from "./stores/commandPaletteStore";
import { useSplitPaneStore } from "./stores/splitPaneStore";
import { useDashboardStore, type PageId } from "./stores/dashboardStore";
import { Command } from "./stores/commandPaletteStore";
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

  // Helper to navigate to pages
  const navigateToPage = (pageId: string) => {
    useDashboardStore.getState().navigateTo(pageId as PageId);
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
      action: () => navigateToPage("vectorSearch"),
    },
    {
      id: "embedding-cache",
      label: "Embedding Cache",
      description: "Manage embedding cache",
      icon: "📦",
      shortcut: "Cmd+Shift+E",
      category: "AI Features",
      action: () => navigateToPage("embeddingCache"),
    },
    {
      id: "cluster-visualization",
      label: "Cluster Visualization",
      description: "Visualize embedding clusters",
      icon: "🎯",
      shortcut: "Cmd+Shift+D",
      category: "AI Features",
      action: () => navigateToPage("clusterVis"),
    },
    {
      id: "llm-chat",
      label: "AI Chat (RAG)",
      description: "Chat with LLM using RAG",
      icon: "🤖",
      shortcut: "Cmd+Shift+A",
      category: "AI Features",
      action: () => navigateToPage("llmChat"),
    },
    {
      id: "monitoring",
      label: "Monitoring Dashboard",
      description: "View real-time Redis metrics",
      icon: "📊",
      shortcut: "Cmd+Shift+M",
      category: "Monitoring",
      action: () => navigateToPage("monitoring"),
    },
    {
      id: "cluster",
      label: "Cluster Topology",
      description: "View Redis cluster topology",
      icon: "🔗",
      shortcut: "Cmd+Shift+C",
      category: "Monitoring",
      action: () => navigateToPage("cluster"),
    },
    {
      id: "pubsub",
      label: "Pub/Sub Monitor",
      description: "Monitor and publish messages",
      icon: "📡",
      shortcut: "Cmd+Shift+P",
      category: "Monitoring",
      action: () => navigateToPage("pubsub"),
    },
    {
      id: "query-optimizer",
      label: "Query Optimizer",
      description: "Optimize Redis queries with AI",
      icon: "⚡",
      shortcut: "Cmd+Shift+Q",
      category: "AI Features",
      action: () => navigateToPage("queryOptimizer"),
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

      // Page shortcuts - use dashboard store
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        switch (e.key.toUpperCase()) {
          case "V":
            e.preventDefault();
            navigateToPage("vectorSearch");
            break;
          case "E":
            e.preventDefault();
            navigateToPage("embeddingCache");
            break;
          case "A":
            e.preventDefault();
            navigateToPage("llmChat");
            break;
          case "M":
            e.preventDefault();
            navigateToPage("monitoring");
            break;
          case "C":
            e.preventDefault();
            navigateToPage("cluster");
            break;
          case "P":
            e.preventDefault();
            navigateToPage("pubsub");
            break;
          case "D":
            e.preventDefault();
            navigateToPage("clusterVis");
            break;
          case "Q":
            e.preventDefault();
            navigateToPage("queryOptimizer");
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

  // Listen for native menu events from Tauri
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        unlisten = await listen<string>("menu-event", (event) => {
          switch (event.payload) {
            case "new_conn":
              setShowConnectionManager(true);
              break;
            case "import_export":
              setShowImportExport(true);
              break;
            case "cmd_palette":
              open();
              break;
            case "toggle_sidebar":
              useDashboardStore.getState().toggleLeftSidebar();
              break;
            case "about":
              import("./stores/toastStore").then(({ useToastStore }) => {
                useToastStore.getState().addToast("info", "Redust — Next-Gen Redis GUI v0.1.0", 5000);
              });
              break;
          }
        });
      } catch {
        // Not running in Tauri
      }
    })();

    return () => {
      unlisten?.();
    };
  }, [open]);

  return (
    <div className="flex h-screen flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Native-style Title Bar — all-in-one: breadcrumb, actions, window controls */}
      <TitleBar
        onOpenCommandPalette={open}
        onAddConnection={() => setShowConnectionManager(true)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <DashboardLayout>
          <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <ConnectionList />
            </div>
            <div className="lg:col-span-2">
              <KeyBrowser onKeyClick={handleKeyClick} onRightClick={handleRightClick} />
            </div>
          </div>
        </DashboardLayout>
      </div>

      {/* Modal Components (remain as modals for focused tasks) */}
      <ImportExport isOpen={showImportExport} onClose={() => setShowImportExport(false)} />
      <LuaScriptEditor isOpen={showLuaEditor} onClose={() => setShowLuaEditor(false)} />

      <CommandPalette isOpen={isOpen} onClose={close} commands={commands} />
      <ConnectionManager
        isOpen={showConnectionManager}
        onClose={() => setShowConnectionManager(false)}
      />

      <SplitPane />

      <ToastContainer />

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
