import { useState, useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { useDashboardStore, type PageId } from "../stores/dashboardStore";

const PAGE_LABELS: Record<PageId, string> = {
  dashboard: "Keys",
  vectorSearch: "Vector Search",
  embeddingCache: "Embedding Cache",
  clusterVis: "Clusters",
  llmChat: "AI Chat",
  queryOptimizer: "Query Optimizer",
  monitoring: "Monitoring",
  cluster: "Cluster Topology",
  pubsub: "Pub/Sub",
};

interface TitleBarProps {
  onOpenCommandPalette?: () => void;
  onAddConnection?: () => void;
}

export function TitleBar({ onOpenCommandPalette, onAddConnection }: TitleBarProps) {
  const [maximized, setMaximized] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const currentPage = useDashboardStore((s) => s.currentPage);

  useEffect(() => {
    appWindow.isMaximized().then(setMaximized);

    const unlistenFocus = appWindow.onFocusChanged(({ payload: focused }) => {
      setIsFocused(focused);
    });

    return () => {
      unlistenFocus.then((fn) => fn());
    };
  }, []);

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => {
    if (maximized) appWindow.unmaximize();
    else appWindow.maximize();
    setMaximized(!maximized);
  };
  const handleClose = () => appWindow.close();

  const isMac = navigator.userAgent.includes("Mac");

  return (
    <div
      className={`flex h-9 select-none items-center border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 ${
        isFocused ? "" : "opacity-75"
      }`}
      data-tauri-drag-region
    >
      {/* macOS: reserve space for traffic lights */}
      {isMac && <div className="w-20" data-tauri-drag-region />}

      {/* App name */}
      <div className="flex items-center gap-2 pl-3" data-tauri-drag-region>
        <span className="text-xs font-bold text-red-500">Redust</span>
      </div>

      {/* Breadcrumb: current page */}
      {currentPage !== "dashboard" && (
        <div className="ml-2 flex items-center gap-1.5" data-tauri-drag-region>
          <span className="text-[10px] text-zinc-400">/</span>
          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            {PAGE_LABELS[currentPage]}
          </span>
        </div>
      )}

      {/* Connection indicator */}
      <div className="ml-3 flex items-center gap-1.5" data-tauri-drag-region>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-[10px] text-zinc-500 dark:text-zinc-500">localhost:6379</span>
      </div>

      {/* Center spacer - draggable */}
      <div className="flex-1" data-tauri-drag-region />

      {/* Right actions (non-draggable) */}
      <div className="flex items-center gap-1 pr-1">
        {/* Add connection */}
        {onAddConnection && (
          <button
            onClick={onAddConnection}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            title="Add Connection"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        {/* Command palette */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex h-6 items-center gap-1 rounded px-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            title="Command Palette (⌘K)"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 text-[9px] dark:border-zinc-600 dark:bg-zinc-800">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Separator before window controls */}
        {!isMac && <div className="mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />}

        {/* Window controls: Windows/Linux only */}
        {!isMac && (
          <>
            <button
              onClick={handleMinimize}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700"
              title="Minimize"
            >
              <svg width="10" height="1" viewBox="0 0 10 1" className="fill-current">
                <rect width="10" height="1" />
              </svg>
            </button>

            <button
              onClick={handleMaximize}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700"
              title={maximized ? "Restore" : "Maximize"}
            >
              {maximized ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect x="2" y="0" width="8" height="8" />
                  <rect x="0" y="2" width="8" height="8" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect x="0.5" y="0.5" width="9" height="9" />
                </svg>
              )}
            </button>

            <button
              onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-zinc-500 transition-colors hover:bg-red-500 hover:text-white dark:text-zinc-400"
              title="Close"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M1 1l8 8M9 1l-8 8" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
