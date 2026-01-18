import { computed, watch } from 'vue';
import type { CartItem } from '~/types';

const STORAGE_KEY = 'eshop-cart';

export const useCart = () => {
  const items = useState<CartItem[]>('cart-items', () => []);

  if (process.client && items.value.length === 0) {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        items.value = JSON.parse(stored) as CartItem[];
      } catch {
        items.value = [];
      }
    }
  }

  if (process.client) {
    watch(
      items,
      (value) => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      },
      { deep: true },
    );
  }

  const itemCount = computed(() =>
    items.value.reduce((total, item) => total + item.quantity, 0),
  );
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  const addItem = (item: CartItem) => {
    const existing = items.value.find((entry) => entry.variantId === item.variantId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.value.push({ ...item });
    }
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    const entry = items.value.find((item) => item.variantId === variantId);
    if (!entry) return;
    entry.quantity = Math.max(1, quantity);
  };

  const removeItem = (variantId: string) => {
    items.value = items.value.filter((item) => item.variantId !== variantId);
  };

  const clear = () => {
    items.value = [];
  };

  return {
    items,
    itemCount,
    total,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  };
};
