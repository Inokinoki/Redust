import { useState } from "react";
import { ConnectionList } from "./components/ConnectionList";
import { KeyBrowser } from "./components/KeyBrowser";
import { ValueEditor } from "./components/ValueEditor";
import { Button } from "./components/ui/button";
import "./index.css";

function App() {
  const [showConnectionManager, setShowConnectionManager] = useState(false);
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
          <Button onClick={() => setShowConnectionManager(true)}>
            + Add Connection
          </Button>
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

      {showConnectionManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative z-50 w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Add Redis Connection</h2>
            <div className="text-center py-4">
              <p className="text-zinc-400">Connection Manager UI</p>
              <p className="text-sm text-zinc-500 mt-2">
                Connection form will be implemented in next iteration.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowConnectionManager(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

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
