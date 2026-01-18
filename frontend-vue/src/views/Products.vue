<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore } from '../store';

const store = useStore();
const search = ref('');

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) {
    return store.state.products;
  }
  return store.state.products.filter((product) => {
    const haystack = `${product.name} ${product.description || ''}`.toLowerCase();
    return haystack.includes(term);
  });
});

onMounted(store.loadProducts);
</script>

<template>
  <section class="section">
    <div class="section-title">
      <div>
        <p class="section-kicker">Catalog</p>
        <h2>Products</h2>
      </div>
      <div class="search">
        <input
          v-model="search"
          type="search"
          placeholder="Search pieces"
          aria-label="Search products"
        />
      </div>
    </div>

    <div class="product-toolbar">
      <span class="pill">Tailored cuts</span>
      <span class="pill">Soft structure</span>
      <span class="pill">Natural fibers</span>
      <span class="pill">Seasonal neutrals</span>
    </div>

    <div v-if="store.state.loading" class="loading">Loading products...</div>
    <div v-else-if="store.state.error" class="notice error">{{ store.state.error }}</div>

    <div v-else class="product-grid">
      <article
        v-for="product in filtered"
        :key="product.id"
        class="product-card"
      >
        <div class="product-media">
          <router-link class="product-link" :to="`/products/${product.id}`">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
            <span v-else>THREADLINE</span>
          </router-link>
          <div class="product-overlay">
            <button
              class="add-to-cart"
              type="button"
              @click="store.addToCart(product)"
            >
              Agregar al carrito
            </button>
            <div class="size-row">
              <button type="button" class="size-btn" @click="store.addToCart(product)">S</button>
              <button type="button" class="size-btn" @click="store.addToCart(product)">M</button>
              <button type="button" class="size-btn" @click="store.addToCart(product)">L</button>
              <button type="button" class="size-btn" @click="store.addToCart(product)">XL</button>
            </div>
          </div>
        </div>
        <div class="product-info">
          <h3 class="product-title">
            <router-link class="product-title-link" :to="`/products/${product.id}`">
              {{ product.name }}
            </router-link>
          </h3>
          <div class="product-price">{{ store.formatCurrency(product.price) }}</div>
        </div>
      </article>
    </div>
  </section>
</template>
