import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PanelPosition = "left" | "right" | "bottom";
export type PanelVariant = "panel" | "modal";

export interface PanelState {
  visible: boolean;
  collapsed: boolean;
  position: PanelPosition;
  size?: number; // percentage for resizable panels
}

export interface DashboardState {
  // Panel states - keyed by panel ID
  panels: Record<string, PanelState>;

  // Layout state
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  bottomPanelHeight: number;

  // Actions
  togglePanel: (panelId: string) => void;
  setPanelVisible: (panelId: string, visible: boolean) => void;
  togglePanelCollapse: (panelId: string) => void;
  setPanelPosition: (panelId: string, position: PanelPosition) => void;
  setPanelSize: (panelId: string, size: number) => void;

  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setBottomPanelHeight: (height: number) => void;

  // Reset layout to default
  resetLayout: () => void;
}

// Default panel configurations
const DEFAULT_PANELS: Record<string, PanelState> = {
  monitoring: {
    visible: false,
    collapsed: false,
    position: "bottom",
  },
  pubsub: {
    visible: false,
    collapsed: false,
    position: "right",
  },
  cluster: {
    visible: false,
    collapsed: false,
    position: "right",
  },
  vectorSearch: {
    visible: false,
    collapsed: false,
    position: "bottom",
  },
  embeddingCache: {
    visible: false,
    collapsed: false,
    position: "bottom",
  },
  clusterVis: {
    visible: false,
    collapsed: false,
    position: "right",
  },
  llmChat: {
    visible: false,
    collapsed: false,
    position: "right",
  },
  queryOptimizer: {
    visible: false,
    collapsed: false,
    position: "bottom",
  },
};

const DEFAULT_STATE = {
  panels: DEFAULT_PANELS,
  leftSidebarCollapsed: false,
  rightSidebarCollapsed: false,
  bottomPanelHeight: 300,
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      togglePanel: (panelId) => {
        set((state) => {
          const panel = state.panels[panelId];
          if (!panel) return state;
          return {
            panels: {
              ...state.panels,
              [panelId]: { ...panel, visible: !panel.visible },
            },
          };
        });
      },

      setPanelVisible: (panelId, visible) => {
        set((state) => {
          const panel = state.panels[panelId];
          if (!panel) return state;
          return {
            panels: {
              ...state.panels,
              [panelId]: { ...panel, visible },
            },
          };
        });
      },

      togglePanelCollapse: (panelId) => {
        set((state) => {
          const panel = state.panels[panelId];
          if (!panel) return state;
          return {
            panels: {
              ...state.panels,
              [panelId]: { ...panel, collapsed: !panel.collapsed },
            },
          };
        });
      },

      setPanelPosition: (panelId, position) => {
        set((state) => {
          const panel = state.panels[panelId];
          if (!panel) return state;
          return {
            panels: {
              ...state.panels,
              [panelId]: { ...panel, position },
            },
          };
        });
      },

      setPanelSize: (panelId, size) => {
        set((state) => {
          const panel = state.panels[panelId];
          if (!panel) return state;
          return {
            panels: {
              ...state.panels,
              [panelId]: { ...panel, size },
            },
          };
        });
      },

      toggleLeftSidebar: () => {
        set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed }));
      },

      toggleRightSidebar: () => {
        set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed }));
      },

      setBottomPanelHeight: (height) => {
        set({ bottomPanelHeight: height });
      },

      resetLayout: () => {
        set(DEFAULT_STATE);
      },
    }),
    {
      name: "redust-dashboard-layout",
      partialize: (state) => ({
        panels: state.panels,
        leftSidebarCollapsed: state.leftSidebarCollapsed,
        rightSidebarCollapsed: state.rightSidebarCollapsed,
        bottomPanelHeight: state.bottomPanelHeight,
      }),
    }
  )
);

// Helper hook to get panel state
export const usePanel = (panelId: string) => {
  const panels = useDashboardStore((state) => state.panels);
  const togglePanel = useDashboardStore((state) => state.togglePanel);
  const setPanelVisible = useDashboardStore((state) => state.setPanelVisible);
  const togglePanelCollapse = useDashboardStore((state) => state.togglePanelCollapse);
  const setPanelPosition = useDashboardStore((state) => state.setPanelPosition);

  const panel = panels[panelId] || DEFAULT_PANELS[panelId];

  return {
    ...panel,
    toggle: () => togglePanel(panelId),
    setVisible: (visible: boolean) => setPanelVisible(panelId, visible),
    toggleCollapse: () => togglePanelCollapse(panelId),
    setPosition: (position: PanelPosition) => setPanelPosition(panelId, position),
  };
};
