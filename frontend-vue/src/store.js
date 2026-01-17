import { computed, reactive } from 'vue';
import { fetchProduct, fetchProducts } from './api';

const state = reactive({
  products: [],
  loading: false,
  error: '',
  cart: [],
  cartOpen: false
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

function addToCart(product) {
  const existing = state.cart.find((item) => item.product.id === product.id);
  if (existing) {
    existing.quantity += 1;
    state.cartOpen = true;
    return;
  }
  state.cart.push({ product, quantity: 1 });
  state.cartOpen = true;
}

function updateQuantity(productId, delta) {
  const item = state.cart.find((entry) => entry.product.id === productId);
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

function removeFromCart(productId) {
  state.cart = state.cart.filter((entry) => entry.product.id !== productId);
}

function clearCart() {
  state.cart = [];
}

function openCart() {
  state.cartOpen = true;
}

function closeCart() {
  state.cartOpen = false;
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
    clearCart,
    openCart,
    closeCart
  };
}
