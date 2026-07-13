import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminStoreInfo {
  id: string;
  name: string;
  organization_id: string;
}

interface AdminStoreState {
  activeStoreId: string | null;
  activeStoreName: string | null;
  availableStores: AdminStoreInfo[];
  setAvailableStores: (stores: AdminStoreInfo[]) => void;
  setActiveStore: (storeId: string) => void;
  clearAdminStore: () => void;
}

export const useAdminStore = create<AdminStoreState>()(
  persist(
    (set, get) => ({
      activeStoreId: null,
      activeStoreName: null,
      availableStores: [],

      setAvailableStores: (stores) => {
        const currentActive = get().activeStoreId;
        const isValid = stores.some((s) => s.id === currentActive);
        const next = !isValid || !currentActive ? (stores[0] ?? null) : null;

        set({
          availableStores: stores,
          ...(next
            ? { activeStoreId: next.id, activeStoreName: next.name }
            : {}),
        });
      },

      setActiveStore: (storeId) => {
        const store = get().availableStores.find((s) => s.id === storeId);
        if (store) {
          set({ activeStoreId: store.id, activeStoreName: store.name });
        }
      },

      clearAdminStore: () =>
        set({
          activeStoreId: null,
          activeStoreName: null,
          availableStores: [],
        }),
    }),
    { name: "2amclub-admin-context" }
  )
);
