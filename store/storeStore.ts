import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Store } from "@/types";

interface StoreStore {
  activeStore: Store | null;
  setStore: (store: Store) => void;
  clearStore: () => void;
}

export const useStoreStore = create<StoreStore>()(
  persist(
    (set) => ({
      activeStore: null,
      setStore: (store) => {
        set({ activeStore: store });
      },
      clearStore: () => set({ activeStore: null }),
    }),
    {
      name: "2amclub-store",
    },
  ),
);
