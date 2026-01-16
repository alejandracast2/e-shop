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
      <h2>Products</h2>
      <div class="search">
        <input
          v-model="search"
          type="search"
          placeholder="Search pieces"
          aria-label="Search products"
        />
      </div>
    </div>

    <div v-if="store.state.loading" class="loading">Loading products...</div>
    <div v-else-if="store.state.error" class="notice error">{{ store.state.error }}</div>

    <div v-else class="grid">
      <article
        v-for="product in filtered"
        :key="product.id"
        class="card"
      >
        <router-link class="card-link" :to="`/products/${product.id}`">
          <div class="card-image">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
            <span v-else>THREADLINE</span>
          </div>
          <h3>{{ product.name }}</h3>
          <p>{{ product.description || 'Limited run with crafted finish.' }}</p>
        </router-link>
        <div class="card-footer">
          <span class="price">{{ store.formatCurrency(product.price) }}</span>
          <button class="btn btn-primary" @click="store.addToCart(product)">
            Add to cart
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
