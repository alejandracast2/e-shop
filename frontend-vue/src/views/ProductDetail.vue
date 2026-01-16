<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '../store';

const store = useStore();
const route = useRoute();
const router = useRouter();
const product = ref(null);
const loadError = ref('');

const productId = computed(() => Number(route.params.id));

async function load() {
  loadError.value = '';
  try {
    product.value = await store.loadProduct(productId.value);
  } catch (error) {
    loadError.value = error.message || 'Product not found.';
  }
}

onMounted(load);
</script>

<template>
  <section class="detail" v-if="product">
    <div class="detail-media">
      <img
        v-if="product.imageUrl"
        :src="product.imageUrl"
        :alt="product.name"
      />
      <div v-else class="card-image">THREADLINE</div>
    </div>
    <div class="detail-content">
      <p class="pill">In stock: {{ product.stock }}</p>
      <h1>{{ product.name }}</h1>
      <p class="detail-copy">
        {{ product.description || 'Crafted with tailored lines and structured ease.' }}
      </p>
      <div class="detail-meta">
        <div>
          <span class="label">Price</span>
          <div class="price">{{ store.formatCurrency(product.price) }}</div>
        </div>
        <div>
          <span class="label">SKU</span>
          <div>{{ product.sku || 'TL-ESSENTIAL' }}</div>
        </div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-primary" @click="store.addToCart(product)">
          Add to cart
        </button>
        <button class="btn btn-ghost" @click="router.push('/cart')">
          Go to cart
        </button>
      </div>
    </div>
  </section>

  <div v-else-if="loadError" class="notice error">{{ loadError }}</div>
  <div v-else class="loading">Loading product...</div>
</template>
