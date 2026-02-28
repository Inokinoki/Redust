import { useState } from "react";
import { ConnectionList } from "./components/ConnectionList";
import { KeyBrowser } from "./components/KeyBrowser";
import { ValueEditor } from "./components/ValueEditor";
import { VectorSearch } from "./components/VectorSearch";
import { EmbeddingCache } from "./components/EmbeddingCache";
import { LLMConversation } from "./components/LLMConversation";
import { Button } from "./components/ui/button";
import "./index.css";

function App() {
  const [showVectorSearch, setShowVectorSearch] = useState(false);
  const [showEmbeddingCache, setShowEmbeddingCache] = useState(false);
  const [showLLMChat, setShowLLMChat] = useState(false);
  const [selectedKey, setSelectedKey] = useState<{
    key: string;
    type: string;
  } | null>(null);

  const handleKeyClick = (key: string, type: string) => {
    setSelectedKey({ key, type });
  };

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
