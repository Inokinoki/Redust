import { create } from "zustand";

export type CommandCategory =
  | "Navigation"
  | "Key Operations"
  | "Connection"
  | "AI Features"
  | "Monitoring"
  | "Advanced"
  | "Settings";

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  category: CommandCategory;
  action: () => void;
}

interface CommandPaletteState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCommandPalette = create<CommandPaletteState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
