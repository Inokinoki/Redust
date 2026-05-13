import { useState } from "react";
import { Button } from "../ui/button";
import { useDashboardStore } from "../../stores/dashboardStore";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  shortcut: string;
  group: "ai" | "monitor" | "tools";
}

const NAV_ITEMS: NavItem[] = [
  // AI Features
  { id: "vectorSearch", label: "Vector Search", icon: "🔍", shortcut: "Cmd+Shift+V", group: "ai" },
  { id: "embeddingCache", label: "Embedding Cache", icon: "📦", shortcut: "Cmd+Shift+E", group: "ai" },
  { id: "clusterVis", label: "Clusters", icon: "🎯", shortcut: "Cmd+Shift+D", group: "ai" },
  { id: "llmChat", label: "AI Chat", icon: "🤖", shortcut: "Cmd+Shift+A", group: "ai" },
  { id: "queryOptimizer", label: "Query Optimizer", icon: "⚡", shortcut: "Cmd+Shift+Q", group: "ai" },
  // Monitor
  { id: "monitoring", label: "Monitoring", icon: "📊", shortcut: "Cmd+Shift+M", group: "monitor" },
  { id: "cluster", label: "Cluster Topology", icon: "🔗", shortcut: "Cmd+Shift+C", group: "monitor" },
  { id: "pubsub", label: "Pub/Sub", icon: "📡", shortcut: "Cmd+Shift+P", group: "monitor" },
  // Tools (these open modals, handled in App.tsx)
  { id: "importExport", label: "Import/Export", icon: "📥", shortcut: "Cmd+Shift+I", group: "tools" },
  { id: "luaEditor", label: "Lua Editor", icon: "📝", shortcut: "Cmd+Shift+L", group: "tools" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const toggleGroup = (group: string) => {
    setOpenGroup(openGroup === group ? null : group);
  };

  const handleItemClick = (item: NavItem) => {
    // Toggle panel visibility for panel items
    useDashboardStore.getState().togglePanel(item.id);
  };

  const groups = [
    { id: "ai", label: "AI", icon: "🧠" },
    { id: "monitor", label: "Monitor", icon: "📈" },
    { id: "tools", label: "Tools", icon: "🔧" },
  ];

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
        <div className="mt-4 flex flex-col gap-2">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => toggleGroup(group.id)}
              className="flex h-10 w-10 items-center justify-center rounded text-lg hover:bg-zinc-200 dark:hover:bg-zinc-800"
              title={group.label}
            >
              {group.icon}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-64 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Tools</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-7 w-7 p-0 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          title="Collapse sidebar"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-auto py-2">
        {groups.map((group) => {
          const groupItems = NAV_ITEMS.filter((item) => item.group === group.id);
          const isOpen = openGroup === group.id;

          return (
            <div key={group.id} className="mb-2">
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <span className="text-lg">{group.icon}</span>
                <span>{group.label}</span>
                <svg
                  className={`ml-auto h-4 w-4 text-zinc-500 transition-transform dark:text-zinc-500 ${isOpen ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {isOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {groupItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <span>{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <kbd className="hidden rounded border border-zinc-300 bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500 lg:block">
                        {item.shortcut.replace("Cmd+", "⌘").replace("Shift+", "⇧")}
                      </kbd>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
