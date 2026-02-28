import { useState, useEffect } from "react";
import { ConnectionList } from "./components/ConnectionList";
import { KeyBrowser } from "./components/KeyBrowser";
import { ValueEditor } from "./components/ValueEditor";
import { VectorSearch } from "./components/VectorSearch";
import { EmbeddingCache } from "./components/EmbeddingCache";
import { LLMConversation } from "./components/LLMConversation";
import { MonitoringDashboard } from "./components/MonitoringDashboard";
import { ClusterTopology } from "./components/ClusterTopology";
import { PubSubMonitor } from "./components/PubSubMonitor";
import { ImportExport } from "./components/ImportExport";
import { LuaScriptEditor } from "./components/LuaScriptEditor";
import { CommandPalette } from "./components/CommandPalette";
import { useCommandPalette } from "./stores/commandPaletteStore";
import { Command } from "./stores/commandPaletteStore";
import { Button } from "./components/ui/button";
import "./index.css";

function App() {
  const [showVectorSearch, setShowVectorSearch] = useState(false);
  const [showEmbeddingCache, setShowEmbeddingCache] = useState(false);
  const [showLLMChat, setShowLLMChat] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [showCluster, setShowCluster] = useState(false);
  const [showPubSub, setShowPubSub] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showLuaEditor, setShowLuaEditor] = useState(false);
  const [selectedKey, setSelectedKey] = useState<{
    key: string;
    type: string;
  } | null>(null);

  const { isOpen, open, close } = useCommandPalette();

  const handleKeyClick = (key: string, type: string) => {
    setSelectedKey({ key, type });
  };

  const commands: Command[] = [
    {
      id: "search-vectors",
      label: "Search Vectors",
      description: "Perform vector similarity search",
      icon: "🔍",
      shortcut: "Cmd+Shift+V",
      category: "AI Features",
      action: () => setShowVectorSearch(true),
    },
    {
      id: "embedding-cache",
      label: "Embedding Cache",
      description: "Manage embedding cache",
      icon: "📦",
      shortcut: "Cmd+Shift+E",
      category: "AI Features",
      action: () => setShowEmbeddingCache(true),
    },
    {
      id: "llm-chat",
      label: "AI Chat (RAG)",
      description: "Chat with LLM using RAG",
      icon: "🤖",
      shortcut: "Cmd+Shift+A",
      category: "AI Features",
      action: () => setShowLLMChat(true),
    },
    {
      id: "monitoring",
      label: "Monitoring Dashboard",
      description: "View real-time Redis metrics",
      icon: "📊",
      shortcut: "Cmd+Shift+M",
      category: "Monitoring",
      action: () => setShowMonitoring(true),
    },
    {
      id: "cluster",
      label: "Cluster Topology",
      description: "View Redis cluster topology",
      icon: "🔗",
      shortcut: "Cmd+Shift+C",
      category: "Monitoring",
      action: () => setShowCluster(true),
    },
    {
      id: "pubsub",
      label: "Pub/Sub Monitor",
      description: "Monitor and publish messages",
      icon: "📡",
      shortcut: "Cmd+Shift+P",
      category: "Monitoring",
      action: () => setShowPubSub(true),
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
      // Command Palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open();
      }

      // Vector Search: Cmd/Ctrl + Shift + V
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "V") {
        e.preventDefault();
        setShowVectorSearch(true);
      }

      // Embedding Cache: Cmd/Ctrl + Shift + E
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "E") {
        e.preventDefault();
        setShowEmbeddingCache(true);
      }

      // LLM Chat: Cmd/Ctrl + Shift + A
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setShowLLMChat(true);
      }

      // Monitoring: Cmd/Ctrl + Shift + M
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "M") {
        e.preventDefault();
        setShowMonitoring(true);
      }

      // Cluster: Cmd/Ctrl + Shift + C
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        setShowCluster(true);
      }

      // Pub/Sub: Cmd/Ctrl + Shift + P
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setShowPubSub(true);
      }

      // Import/Export: Cmd/Ctrl + Shift + I
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        setShowImportExport(true);
      }

      // Lua Editor: Cmd/Ctrl + Shift + L
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "L") {
        e.preventDefault();
        setShowLuaEditor(true);
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowVectorSearch(true)}>
              🔍 Vector Search
            </Button>
            <Button variant="outline" onClick={() => setShowEmbeddingCache(true)}>
              📦 Embedding Cache
            </Button>
            <Button variant="outline" onClick={() => setShowLLMChat(true)}>
              🤖 AI Chat (RAG)
            </Button>
            <Button variant="outline" onClick={() => setShowMonitoring(true)}>
              📊 Monitoring
            </Button>
            <Button variant="outline" onClick={() => setShowCluster(true)}>
              🔗 Cluster
            </Button>
            <Button variant="outline" onClick={() => setShowPubSub(true)}>
              📡 Pub/Sub
            </Button>
            <Button variant="outline" onClick={() => setShowImportExport(true)}>
              📥 Import/Export
            </Button>
            <Button variant="outline" onClick={() => setShowLuaEditor(true)}>
              📝 Lua Editor
            </Button>
            <Button variant="ghost" onClick={open}>
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                ⌘K
              </kbd>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex h-[calc(100vh-4rem)] px-4 py-6">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ConnectionList />
          </div>
          <div className="lg:col-span-2">
            <KeyBrowser onKeyClick={handleKeyClick} />
          </div>
        </div>
      </main>

      <VectorSearch isOpen={showVectorSearch} onClose={() => setShowVectorSearch(false)} />

      <EmbeddingCache isOpen={showEmbeddingCache} onClose={() => setShowEmbeddingCache(false)} />

      <LLMConversation isOpen={showLLMChat} onClose={() => setShowLLMChat(false)} />

      <MonitoringDashboard isOpen={showMonitoring} onClose={() => setShowMonitoring(false)} />

      <ClusterTopology isOpen={showCluster} onClose={() => setShowCluster(false)} />

      <PubSubMonitor isOpen={showPubSub} onClose={() => setShowPubSub(false)} />

      <ImportExport isOpen={showImportExport} onClose={() => setShowImportExport(false)} />

      <LuaScriptEditor isOpen={showLuaEditor} onClose={() => setShowLuaEditor(false)} />

      <CommandPalette isOpen={isOpen} onClose={close} commands={commands} />

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
