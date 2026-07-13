import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartStore {
  itemsByStore: Record<string, CartItem[]>;
  addItem: (storeId: string, product: Product, qty?: number) => void;
  removeItem: (storeId: string, productId: string) => void;
  updateQty: (storeId: string, productId: string, qty: number) => void;
  clearCart: (storeId: string) => void;
  totalItems: (storeId: string) => number;
  totalPrice: (storeId: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      itemsByStore: {},

      addItem: (storeId, product, qty = 1) => {
        set((state) => {
          const storeItems = state.itemsByStore[storeId] || [];
          const existing = storeItems.find((item) => item.product.id === product.id);
          let newStoreItems;
          if (existing) {
            newStoreItems = storeItems.map((item) =>
              item.product.id === product.id
                ? { ...item, qty: Math.min(item.qty + qty, product.stock) }
                : item
            );
          } else {
            newStoreItems = [...storeItems, { product, qty }];
          }
          return {
            itemsByStore: {
              ...state.itemsByStore,
              [storeId]: newStoreItems,
            },
          };
        });
      },

      removeItem: (storeId, productId) => {
        set((state) => {
          const storeItems = state.itemsByStore[storeId] || [];
          return {
            itemsByStore: {
              ...state.itemsByStore,
              [storeId]: storeItems.filter((item) => item.product.id !== productId),
            },
          };
        });
      },

      updateQty: (storeId, productId, qty) => {
        if (qty <= 0) {
          get().removeItem(storeId, productId);
          return;
        }
        set((state) => {
          const storeItems = state.itemsByStore[storeId] || [];
          return {
            itemsByStore: {
              ...state.itemsByStore,
              [storeId]: storeItems.map((item) =>
                item.product.id === productId
                  ? { ...item, qty: Math.min(qty, item.product.stock) }
                  : item
              ),
            },
          };
        });
      },

      clearCart: (storeId) => set((state) => ({
        itemsByStore: { ...state.itemsByStore, [storeId]: [] }
      })),

      totalItems: (storeId) => {
        const storeItems = get().itemsByStore[storeId] || [];
        return storeItems.reduce((sum, item) => sum + item.qty, 0);
      },

      totalPrice: (storeId) => {
        const storeItems = get().itemsByStore[storeId] || [];
        return storeItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
      },
    }),
    {
      name: "2amclub-cart-v2",
      partialize: (state) => ({ itemsByStore: state.itemsByStore }),
    }
  )
);
