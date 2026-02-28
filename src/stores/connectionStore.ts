import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConnectionConfig } from "../types";

interface ConnectionStore {
  connections: ConnectionConfig[];
  activeConnectionId: string | null;
  addConnection: (connection: ConnectionConfig) => void;
  updateConnection: (id: string, connection: Partial<ConnectionConfig>) => void;
  deleteConnection: (id: string) => void;
  setActiveConnection: (id: string | null) => void;
  getActiveConnection: () => ConnectionConfig | undefined;
}

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set, get) => ({
      connections: [],
      activeConnectionId: null,

      addConnection: (connection) =>
        set((state) => ({
          connections: [...state.connections, connection],
        })),

      updateConnection: (id, connection) =>
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...connection } : c
          ),
        })),

      deleteConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          activeConnectionId:
            state.activeConnectionId === id ? null : state.activeConnectionId,
        })),

      setActiveConnection: (id) => set({ activeConnectionId: id }),

      getActiveConnection: () => {
        const { connections, activeConnectionId } = get();
        return connections.find((c) => c.id === activeConnectionId);
      },
    }),
    {
      name: "redust-connections",
    }
  )
);
