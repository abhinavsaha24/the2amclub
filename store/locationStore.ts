import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Location } from "@/types";
import { useCartStore } from "./cartStore";

interface LocationStore {
  activeLocation: Location | null;
  setLocation: (location: Location) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      activeLocation: null,
      setLocation: (location) => {
        set({ activeLocation: location });
        useCartStore.getState().clearCart();
      },
      clearLocation: () => set({ activeLocation: null }),
    }),
    {
      name: "2amclub-location",
    },
  ),
);
