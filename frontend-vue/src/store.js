import { computed, reactive } from 'vue';
import { fetchProduct, fetchProducts } from './api';

const state = reactive({
  products: [],
  loading: false,
  error: '',
  cart: [],
  cartOpen: false
});

function getImageUrl(product) {
  const cover = product.images?.find((image) => image.isCover) || product.images?.[0];
  return cover?.file?.url || null;
}

function normalizeProduct(product) {
  const variants = product.variants || [];
  const prices = variants.map((variant) => Number(variant.price || 0)).filter((price) => price > 0);
  const displayPrice = prices.length ? Math.min(...prices) : Number(product.price || 0);

  return {
    ...product,
    imageUrl: getImageUrl(product),
    displayPrice
  };
}

async function loadProducts() {
  if (state.products.length) {
    return;
  }
  state.loading = true;
  state.error = '';
  try {
    const products = await fetchProducts();
    state.products = products.map((product) => normalizeProduct(product));
  } catch (error) {
    state.error = error.message || 'Failed to load products.';
  } finally {
    state.loading = false;
  }
}

async function loadProduct(slug) {
  const existing = state.products.find((product) => product.slug === slug);
  const hasVariantDetails = existing?.variants?.some(
    (variant) => variant.attributes && variant.attributes.length
  );
  if (existing && hasVariantDetails) {
    return existing;
  }
  const product = await fetchProduct(slug);
  const normalized = normalizeProduct(product);
  if (existing) {
    state.products = state.products.map((item) =>
      item.slug === slug ? normalized : item
    );
  } else {
    state.products.push(normalized);
  }
  return normalized;
}

function getCartKey(productId, variantId) {
  return `${productId}:${variantId || 'default'}`;
}

function resolveVariant(product, variant) {
  if (variant) {
    return variant;
  }
  if (product.variants?.length === 1) {
    return product.variants[0];
  }
  return null;
}

function addToCart(product, variant) {
  const resolvedVariant = resolveVariant(product, variant);
  if (product.variants?.length && !resolvedVariant) {
    return;
  }
  const key = getCartKey(product.id, resolvedVariant?.id);
  const existing = state.cart.find((item) => item.key === key);
  if (existing) {
    existing.quantity += 1;
    state.cartOpen = true;
    return;
  }
  state.cart.push({
    key,
    product,
    variant: resolvedVariant,
    quantity: 1
  });
  state.cartOpen = true;
}

function updateQuantity(key, delta) {
  const item = state.cart.find((entry) => entry.key === key);
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

function removeFromCart(key) {
  state.cart = state.cart.filter((entry) => entry.key !== key);
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
    (total, item) =>
      total + item.quantity * Number(item.variant?.price ?? item.product.displayPrice ?? 0),
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
