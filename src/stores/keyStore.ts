import { create } from "zustand";
import type { KeyInfo } from "../types";

interface KeyStore {
  keys: KeyInfo[];
  selectedKey: string | null;
  searchPattern: string;
  isLoading: boolean;
  setKeys: (keys: KeyInfo[]) => void;
  setSelectedKey: (key: string | null) => void;
  setSearchPattern: (pattern: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useKeyStore = create<KeyStore>((set) => ({
  keys: [],
  selectedKey: null,
  searchPattern: "*",
  isLoading: false,

  setKeys: (keys) => set({ keys }),
  setSelectedKey: (key) => set({ selectedKey: key }),
  setSearchPattern: (pattern) => set({ searchPattern: pattern }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
