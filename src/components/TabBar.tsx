import { useTabStore } from "../stores/tabStore";
import { useConnectionStore } from "../stores/connectionStore";

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();
  const connections = useConnectionStore((s) => s.connections);

  if (tabs.length === 0) return null;

  return (
    <div className="flex h-8 items-end gap-0 overflow-x-auto border-b border-zinc-200 bg-zinc-50 px-2 dark:border-zinc-800 dark:bg-zinc-900">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const conn = connections.find((c) => c.id === tab.connectionId);

        return (
          <div
            key={tab.id}
            className={`group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-t-md px-3 py-1 text-[11px] font-medium transition-colors ${
              isActive
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isActive ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
            <span className="max-w-[120px] truncate">
              {conn ? `${conn.name}: ${tab.title}` : tab.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="ml-0.5 rounded p-0.5 opacity-0 transition-opacity hover:bg-zinc-200 group-hover:opacity-100 dark:hover:bg-zinc-700"
            >
              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
