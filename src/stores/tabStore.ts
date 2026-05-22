import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PageId } from "./dashboardStore";
import { getPageLabel, PAGE_LABELS } from "../constants/pageLabels";

export type { PageId };

export interface Tab {
  id: string;
  connectionId: string;
  pageId: PageId;
  title: string;
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;

  openTab: (connectionId: string, pageId: PageId, title?: string) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  getActiveTab: () => Tab | undefined;
  updateTabTitle: (tabId: string, title: string) => void;
}

export { getPageLabel };

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      openTab: (connectionId, pageId, title) => {
        const { tabs } = get();
        // Reuse existing tab if same connection + page
        const existing = tabs.find(
          (t) => t.connectionId === connectionId && t.pageId === pageId
        );
        if (existing) {
          set({ activeTabId: existing.id });
          return existing.id;
        }

        const id = `tab-${crypto.randomUUID()}`;
        const newTab: Tab = {
          id,
          connectionId,
          pageId,
          title: title || PAGE_LABELS[pageId],
        };
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: id,
        }));
        return id;
      },

      closeTab: (tabId) => {
        set((state) => {
          const newTabs = state.tabs.filter((t) => t.id !== tabId);
          let newActiveId = state.activeTabId;
          if (state.activeTabId === tabId) {
            // Switch to adjacent tab
            const idx = state.tabs.findIndex((t) => t.id === tabId);
            if (newTabs.length > 0) {
              const newIdx = Math.min(idx, newTabs.length - 1);
              newActiveId = newTabs[newIdx].id;
            } else {
              newActiveId = null;
            }
          }
          return { tabs: newTabs, activeTabId: newActiveId };
        });
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      getActiveTab: () => {
        const { tabs, activeTabId } = get();
        return tabs.find((t) => t.id === activeTabId);
      },

      updateTabTitle: (tabId, title) =>
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, title } : t
          ),
        })),
    }),
    {
      name: "redust-tabs",
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
);
