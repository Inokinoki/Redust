import { useSplitPaneStore } from "../stores/splitPaneStore";
import { Button } from "./ui/button";
import { ValueEditor } from "./ValueEditor";

export function SplitPane() {
  const { splitMode, leftKey, rightKey, setSplitMode, setLeftKey, setRightKey, resetSplit } =
    useSplitPaneStore();

  if (splitMode === "none") return null;

  const isHorizontal = splitMode === "horizontal";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 flex h-[90vh] w-full max-w-7xl flex-col rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h2 className="text-xl font-semibold">Split View - Key Comparison</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSplitMode("horizontal")}
              variant={isHorizontal ? "default" : "outline"}
              size="sm"
            >
              Horizontal
            </Button>
            <Button
              onClick={() => setSplitMode("vertical")}
              variant={!isHorizontal ? "default" : "outline"}
              size="sm"
            >
              Vertical
            </Button>
            <Button onClick={resetSplit} variant="ghost" size="sm">
              ✕
            </Button>
          </div>
        </div>

        <div className={`flex flex-1 overflow-hidden ${isHorizontal ? "flex-row" : "flex-col"}`}>
          <div className={`${isHorizontal ? "w-1/2" : "h-1/2"} flex-1`}>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-2">
                <h3 className="font-medium text-zinc-300">Left Pane</h3>
                {leftKey && (
                  <Button onClick={() => setLeftKey(null)} variant="ghost" size="sm">
                    ✕
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                {leftKey ? (
                  <ValueEditor
                    isOpen={true}
                    key={leftKey.key}
                    keyType={leftKey.type}
                    onClose={() => setLeftKey(null)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-500">
                    Click a key to open in this pane
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className={`flex flex-col border-zinc-800 ${isHorizontal ? "w-1 border-l" : "h-1 border-t"}`}
          />

          <div className={`${isHorizontal ? "w-1/2" : "h-1/2"} flex-1`}>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-2">
                <h3 className="font-medium text-zinc-300">Right Pane</h3>
                {rightKey && (
                  <Button onClick={() => setRightKey(null)} variant="ghost" size="sm">
                    ✕
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                {rightKey ? (
                  <ValueEditor
                    isOpen={true}
                    key={rightKey.key}
                    keyType={rightKey.type}
                    onClose={() => setRightKey(null)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-500">
                    Click a key to open in this pane
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SplitButton() {
  const { splitMode, resetSplit } = useSplitPaneStore();

  if (splitMode === "none") {
    return (
      <Button
        variant="outline"
        onClick={() => useSplitPaneStore.getState().setSplitMode("horizontal")}
      >
        Split View
      </Button>
    );
  }

  return (
    <Button variant="default" onClick={resetSplit}>
      Close Split
    </Button>
  );
}
