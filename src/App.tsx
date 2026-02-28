import { useState } from "react";
import { ConnectionManager } from "./components/ConnectionManager";
import { ConnectionList } from "./components/ConnectionList";
import { KeyBrowser } from "./components/KeyBrowser";
import { Button } from "./components/ui/button";
import "./index.css";

function App() {
  const [showConnectionManager, setShowConnectionManager] = useState(false);

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
            <KeyBrowser />
          </div>
        </div>
      </main>

      <ConnectionManager
        isOpen={showConnectionManager}
        onClose={() => setShowConnectionManager(false)}
      />
    </div>
  );
}

export default App;