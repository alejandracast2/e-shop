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
          <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
          <div v-else class="placeholder">{{ initials }}</div>
        </div>
        <div class="detail-info">
          <div class="eyebrow">Producto</div>
          <h1>{{ product.name }}</h1>
          <p class="subtitle">
            {{ product.description || 'Disenado para elevar tu rutina diaria.' }}
          </p>
          <div class="price">${{ product.price.toFixed(2) }}</div>
          <div class="stock" :class="{ low: product.stock < 5 }">
            {{ product.stock }} disponibles
          </div>
          <div class="actions">
            <label class="qty">
              Cantidad
              <input v-model.number="quantity" type="number" min="1" />
            </label>
            <button class="btn btn-primary" type="button" @click="addToCart">
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Product } from '~/types';

const route = useRoute();
const config = useRuntimeConfig();
const productId = Number(route.params.id);
const quantity = ref(1);

const { data: product, pending, error } = await useFetch<Product>(
  `/products/${productId}`,
  { baseURL: config.public.apiUrl },
);

const initials = computed(() =>
  product.value?.name
    ? product.value.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : '',
);

const { addItem } = useCart();
const addToCart = () => {
  if (!product.value) return;
  addItem({
    productId: product.value.id,
    name: product.value.name,
    price: product.value.price,
    imageUrl: product.value.imageUrl ?? undefined,
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

.stock.low {
  color: var(--accent-strong);
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
