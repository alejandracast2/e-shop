<template>
  <article class="product-card">
    <NuxtLink :to="`/product/${product.id}`" class="product-image">
      <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
      <div v-else class="placeholder">{{ initials }}</div>
    </NuxtLink>
    <div class="product-body">
      <div>
        <h3>{{ product.name }}</h3>
        <p>{{ product.description || 'Detalles curados para tu rutina diaria.' }}</p>
      </div>
      <div class="product-footer">
        <span class="price">${{ product.price.toFixed(2) }}</span>
        <button class="btn btn-primary" type="button" @click="addToCart">
          Agregar
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Product } from '~/types';

const props = defineProps<{ product: Product }>();
const { addItem } = useCart();

const initials = computed(() =>
  props.product.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
);

const addToCart = () => {
  addItem({
    productId: props.product.id,
    name: props.product.name,
    price: props.product.price,
    imageUrl: props.product.imageUrl ?? undefined,
    quantity: 1,
  });
};
</script>

<style scoped>
.product-card {
  background: #fff;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  min-height: 360px;
}

.product-image {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #f9e4d2, #ffe9db);
  display: grid;
  place-items: center;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 80px;
  height: 80px;
  border-radius: 26px;
  background: rgba(214, 75, 42, 0.12);
  color: var(--accent-strong);
  font-weight: 700;
  display: grid;
  place-items: center;
  font-size: 20px;
}

.product-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  justify-content: space-between;
}

.product-body h3 {
  margin: 0 0 6px;
  font-size: 18px;
}

.product-body p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.price {
  font-weight: 700;
}
</style>
