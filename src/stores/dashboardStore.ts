import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PageId =
  | "dashboard"
  | "vectorSearch"
  | "embeddingCache"
  | "clusterVis"
  | "llmChat"
  | "queryOptimizer"
  | "monitoring"
  | "cluster"
  | "pubsub";

export interface DashboardState {
  // Page navigation
  currentPage: PageId;
  navigateTo: (page: PageId) => void;

  // Sidebar state
  leftSidebarCollapsed: boolean;
  toggleLeftSidebar: () => void;
}

const DEFAULT_STATE = {
  currentPage: "dashboard" as PageId,
  leftSidebarCollapsed: false,
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      navigateTo: (page) => {
        set({ currentPage: page });
      },

      toggleLeftSidebar: () => {
        set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed }));
      },
    }),
    {
      name: "redust-dashboard-layout",
      partialize: (state) => ({
        leftSidebarCollapsed: state.leftSidebarCollapsed,
      }),
    }
  )
);

