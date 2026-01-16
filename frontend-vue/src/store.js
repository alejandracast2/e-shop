import { computed, reactive } from 'vue';
import { fetchProduct, fetchProducts } from './api';

const state = reactive({
  products: [],
  loading: false,
  error: '',
  cart: []
});

async function loadProducts() {
  if (state.products.length) {
    return;
  }
  state.loading = true;
  state.error = '';
  try {
    state.products = await fetchProducts();
  } catch (error) {
    state.error = error.message || 'Failed to load products.';
  } finally {
    state.loading = false;
  }
}

async function loadProduct(id) {
  const existing = state.products.find((product) => product.id === id);
  if (existing) {
    return existing;
  }
  const product = await fetchProduct(id);
  state.products.push(product);
  return product;
}

function addToCart(product, variant) {
  if (!variant) {
    return;
  }
  const existing = state.cart.find((item) => item.variant.id === variant.id);
  if (existing) {
    existing.quantity += 1;
    return;
  }
  state.cart.push({ product, variant, quantity: 1 });
}

function updateQuantity(variantId, delta) {
  const item = state.cart.find((entry) => entry.variant.id === variantId);
  if (!item) {
    return;
  }
  const next = item.quantity + delta;
  if (next <= 0) {
    state.cart = state.cart.filter((entry) => entry !== item);
    return;
  }
  item.quantity = next;
}

function removeFromCart(variantId) {
  state.cart = state.cart.filter((entry) => entry.variant.id !== variantId);
}

function clearCart() {
  state.cart = [];
}

const cartCount = computed(() =>
  state.cart.reduce((total, item) => total + item.quantity, 0)
);

const subtotal = computed(() =>
  state.cart.reduce(
    (total, item) => total + item.quantity * Number(item.product.price || 0),
    0
  )
);

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);
}

export function useStore() {
  return {
    state,
    cartCount,
    subtotal,
    formatCurrency,
    loadProducts,
    loadProduct,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  };
}
