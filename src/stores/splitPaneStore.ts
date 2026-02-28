import { create } from "zustand";

export type SplitMode = "none" | "horizontal" | "vertical";

interface SplitPaneState {
  splitMode: SplitMode;
  leftKey: { key: string; type: string } | null;
  rightKey: { key: string; type: string } | null;
  setSplitMode: (mode: SplitMode) => void;
  setLeftKey: (key: { key: string; type: string } | null) => void;
  setRightKey: (key: { key: string; type: string } | null) => void;
  resetSplit: () => void;
}

export const useSplitPaneStore = create<SplitPaneState>((set) => ({
  splitMode: "none",
  leftKey: null,
  rightKey: null,
  setSplitMode: (mode) => set({ splitMode: mode }),
  setLeftKey: (key) => set({ leftKey: key }),
  setRightKey: (key) => set({ rightKey: key }),
  resetSplit: () =>
    set({
      splitMode: "none",
      leftKey: null,
      rightKey: null,
    }),
}));
