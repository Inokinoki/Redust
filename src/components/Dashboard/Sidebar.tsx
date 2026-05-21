import { useState } from "react";
import { Button } from "../ui/button";
import { useConnectionStore } from "../../stores/connectionStore";
import { useTabStore, getPageLabel, type PageId } from "../../stores/tabStore";
import type { ConnectionConfig } from "../../types";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onAddConnection?: () => void;
}

const PAGE_GROUPS = [
  {
    id: "main",
    label: "Main",
    pages: [
      { pageId: "dashboard" as PageId, icon: "\u{1F511}" },
    ],
  },
  {
    id: "ai",
    label: "AI",
    pages: [
      { pageId: "vectorSearch" as PageId, icon: "\u{1F50D}" },
      { pageId: "embeddingCache" as PageId, icon: "\u{1F4E6}" },
      { pageId: "clusterVis" as PageId, icon: "\u{1F3AF}" },
      { pageId: "llmChat" as PageId, icon: "\u{1F916}" },
      { pageId: "queryOptimizer" as PageId, icon: "\u26A1" },
    ],
  },
  {
    id: "monitor",
    label: "Monitor",
    pages: [
      { pageId: "monitoring" as PageId, icon: "\u{1F4CA}" },
      { pageId: "cluster" as PageId, icon: "\u{1F517}" },
      { pageId: "pubsub" as PageId, icon: "\u{1F4E1}" },
    ],
  },
];

export function Sidebar({ collapsed, onToggle, onAddConnection }: SidebarProps) {
  const [openGroup, setOpenGroup] = useState<string>("main");
  const connections = useConnectionStore((s) => s.connections);
  const activeTab = useTabStore((s) => s.getActiveTab());
  const openTab = useTabStore((s) => s.openTab);

  const toggleGroup = (group: string) => {
    setOpenGroup(openGroup === group ? "" : group);
  };

  const currentConnectionId = activeTab?.connectionId;

  const handleConnectionClick = (conn: ConnectionConfig) => {
    openTab(conn.id, "dashboard");
  };

  const handlePageClick = (pageId: PageId) => {
    if (currentConnectionId) {
      openTab(currentConnectionId, pageId);
    }
  };

  if (collapsed) {
    return (
      <div className="flex w-12 flex-col items-center border-r border-zinc-200 bg-zinc-50 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-10 w-10 p-0 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          title="Expand sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </Button>
        <div className="mt-4 flex flex-col gap-1">
          {connections.map((conn) => (
            <button
              key={conn.id}
              onClick={() => handleConnectionClick(conn)}
              className={`flex h-10 w-10 items-center justify-center rounded text-sm font-bold ${
                currentConnectionId === conn.id
                  ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                  : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
              title={conn.name}
            >
              {conn.name.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-64 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Connection list */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex h-10 items-center justify-between px-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Connections</h2>
          {onAddConnection && (
            <button
              onClick={onAddConnection}
              className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800"
              title="Add Connection"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
        <div className="max-h-40 overflow-y-auto px-1 pb-2">
          {connections.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-zinc-400">No connections</p>
          ) : (
            connections.map((conn) => (
              <button
                key={conn.id}
                onClick={() => handleConnectionClick(conn)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[12px] transition-colors ${
                  currentConnectionId === conn.id
                    ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
                title={`${conn.host}:${conn.port}`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    currentConnectionId === conn.id ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
                <span className="truncate">{conn.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Page index for current connection */}
      {currentConnectionId && (
        <div className="flex-1 overflow-auto">
          <div className="flex h-8 items-center px-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Pages</h2>
          </div>
          <div className="px-1 pb-2">
            {PAGE_GROUPS.map((group) => {
              const isOpen = openGroup === group.id;
              return (
                <div key={group.id} className="mb-1">
                  {group.id !== "main" && (
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      <svg
                        className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span>{group.label}</span>
                    </button>
                  )}
                  {(isOpen || group.id === "main") && (
                    <div className={group.id === "main" ? "" : "ml-3"}>
                      {group.pages.map((page) => (
                        <button
                          key={page.pageId}
                          onClick={() => handlePageClick(page.pageId)}
                          className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[12px] transition-colors ${
                            activeTab?.pageId === page.pageId
                              ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <span className="text-sm">{page.icon}</span>
                          <span className="flex-1 text-left">{getPageLabel(page.pageId)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapse button */}
      <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-start text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs">Collapse</span>
        </Button>
      </div>
    </div>
  );
}
