<template>
  <section class="section">
    <div class="container">
      <NuxtLink to="/" class="back-link"><- Volver al catalogo</NuxtLink>
      <div v-if="pending" class="loading">Cargando producto...</div>
      <div v-else-if="error || !product" class="loading error">
        Producto no disponible.
      </div>
      <div v-else class="detail">
        <div class="detail-media">
          <img v-if="coverImage" :src="coverImage" :alt="product.title" />
          <div v-else class="placeholder">{{ initials }}</div>
        </div>
        <div class="detail-info">
          <div class="eyebrow">Producto</div>
          <h1>{{ product.title }}</h1>
          <p class="subtitle">
            {{ product.description || 'Disenado para elevar tu rutina diaria.' }}
          </p>
          <div v-if="selectedVariant" class="price">
            ${{ selectedVariant.price.toFixed(2) }}
          </div>
          <div v-if="selectedVariant?.availableStock !== undefined" class="stock">
            {{ selectedVariant.availableStock }} disponibles
          </div>
          <div v-if="product.variants?.length" class="variant-select">
            <label>
              Variante
              <select v-model="selectedVariantId">
                <option
                  v-for="variant in product.variants"
                  :key="variant.id"
                  :value="variant.id"
                >
                  {{ variant.sku || variant.id.slice(0, 6) }}
                </option>
              </select>
            </label>
          </div>
          <div class="actions">
            <label class="qty">
              Cantidad
              <input v-model.number="quantity" type="number" min="1" />
            </label>
            <button
              class="btn btn-primary"
              type="button"
              :disabled="!selectedVariant"
              @click="addToCart"
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Product, ProductVariant } from '~/types';

const route = useRoute();
const config = useRuntimeConfig();
const productSlug = route.params.slug as string;
const quantity = ref(1);
const selectedVariantId = ref<string | null>(null);

const { data: product, pending, error } = await useFetch<Product>(
  `/storefront/products/${productSlug}`,
  {
    baseURL: config.public.apiUrl,
    headers: {
      'x-store-slug': config.public.storeSlug,
    },
  },
);

const initials = computed(() =>
  product.value?.title
    ? product.value.title
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : '',
);

const coverImage = computed(
  () => product.value?.images?.[0]?.file?.url ?? null,
);

const selectedVariant = computed<ProductVariant | null>(() => {
  const variants = product.value?.variants ?? [];
  if (!variants.length) return null;
  if (!selectedVariantId.value) return variants[0];
  return variants.find((variant) => variant.id === selectedVariantId.value) ?? variants[0];
});

watchEffect(() => {
  if (!selectedVariantId.value && product.value?.variants?.length) {
    selectedVariantId.value = product.value.variants[0].id;
  }
});

const { addItem } = useCart();
const addToCart = () => {
  if (!product.value || !selectedVariant.value) return;
  addItem({
    variantId: selectedVariant.value.id,
    title: product.value.title,
    price: selectedVariant.value.price,
    imageUrl: coverImage.value ?? undefined,
    quantity: Math.max(1, quantity.value),
  });
};
</script>

<style scoped>
.back-link {
  display: inline-flex;
  margin-bottom: 18px;
  color: var(--muted);
}

.detail {
  display: grid;
  gap: 32px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  align-items: center;
}

.detail-media {
  background: var(--surface-strong);
  border-radius: var(--radius-lg);
  min-height: 280px;
  display: grid;
  place-items: center;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.detail-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 120px;
  height: 120px;
  border-radius: 30px;
  background: rgba(214, 75, 42, 0.12);
  color: var(--accent-strong);
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 700;
}

.detail-info h1 {
  margin: 8px 0 12px;
  font-family: 'Fraunces', serif;
  font-size: 32px;
}

.price {
  font-size: 24px;
  font-weight: 700;
  margin: 16px 0 8px;
}

.stock {
  color: var(--muted);
  font-size: 14px;
}

.variant-select {
  margin-top: 12px;
}

.variant-select select {
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--outline);
}

.actions {
  margin-top: 22px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.qty {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: var(--muted);
  gap: 6px;
}

.qty input {
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid var(--outline);
  width: 100px;
}

.loading {
  color: var(--muted);
}

.loading.error {
  color: var(--accent-strong);
}
</style>
