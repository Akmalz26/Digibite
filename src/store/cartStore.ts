import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  currentTenantId: string | null;
  currentTenantName: string | null;
  addToCart: (product: Product, quantity?: number, forceReplace?: boolean) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getCurrentTenantId: () => string | null;
  getCurrentTenantName: () => string | null;
  hasDifferentTenant: (tenantId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      currentTenantId: null,
      currentTenantName: null,
      addToCart: (product: Product, quantity = 1, forceReplace = false) => {
        const state = get();
        const items = state.items;

        // Check if adding product from different tenant
        if (state.currentTenantId && state.currentTenantId !== product.tenantId) {
          if (!forceReplace) {
            // Return false to indicate different tenant - caller should show confirmation
            return false;
          }
          // Force replace - clear cart and add new product
          set({
            items: [{ product, quantity }],
            currentTenantId: product.tenantId,
            currentTenantName: product.tenantName,
          });
          return true;
        }

        const existingItem = items.find(item => item.product.id === product.id);

        if (existingItem) {
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [...items, { product, quantity }],
            currentTenantId: product.tenantId,
            currentTenantName: product.tenantName,
          });
        }
        return true;
      },
      removeFromCart: (productId: string) => {
        const newItems = get().items.filter(item => item.product.id !== productId);
        if (newItems.length === 0) {
          set({ items: [], currentTenantId: null, currentTenantName: null });
        } else {
          set({ items: newItems });
        }
      },
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set({
          items: get().items.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => {
        set({ items: [], currentTenantId: null, currentTenantName: null });
      },
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
      },
      getCurrentTenantId: () => {
        return get().currentTenantId;
      },
      getCurrentTenantName: () => {
        return get().currentTenantName;
      },
      hasDifferentTenant: (tenantId: string) => {
        const state = get();
        return state.currentTenantId !== null && state.currentTenantId !== tenantId;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
