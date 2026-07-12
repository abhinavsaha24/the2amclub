import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Store } from "@/types";
import { useCartStore } from "./cartStore";

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
        useCartStore.getState().clearCart();
      },
      clearStore: () => set({ activeStore: null }),
    }),
    {
      name: "2amclub-store",
    },
  ),
);
