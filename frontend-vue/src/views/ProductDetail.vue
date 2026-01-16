<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '../store';

const store = useStore();
const route = useRoute();
const router = useRouter();
const product = ref(null);
const loadError = ref('');
const selectedColor = ref('');
const selectedSize = ref('');

const productId = computed(() => Number(route.params.id));

const colors = computed(() => {
  if (!product.value?.variants?.length) return [];
  const unique = new Map();
  for (const variant of product.value.variants) {
    const name = variant.color?.name || variant.color || '';
    if (!name) continue;
    unique.set(name, variant.color);
  }
  return Array.from(unique.values());
});

const sizes = computed(() => {
  if (!product.value?.variants?.length) return [];
  const filtered = product.value.variants.filter((variant) => {
    const name = variant.color?.name || variant.color || '';
    return selectedColor.value ? name === selectedColor.value : true;
  });
  return Array.from(new Set(filtered.map((variant) => variant.size)));
});

const selectedVariant = computed(() => {
  if (!product.value?.variants?.length) return null;
  return (
    product.value.variants.find((variant) => {
      const colorName = variant.color?.name || variant.color || '';
      return (
        (!selectedColor.value || colorName === selectedColor.value) &&
        (!selectedSize.value || variant.size === selectedSize.value)
      );
    }) ?? product.value.variants[0]
  );
});

async function load() {
  loadError.value = '';
  try {
    product.value = await store.loadProduct(productId.value);
  } catch (error) {
    loadError.value = error.message || 'Product not found.';
  }
}

watch(
  () => product.value,
  (value) => {
    if (!value?.variants?.length) return;
    const firstVariant = value.variants[0];
    selectedColor.value = firstVariant.color?.name || firstVariant.color || '';
    selectedSize.value = firstVariant.size;
  },
  { immediate: true },
);

watch(
  () => selectedColor.value,
  () => {
    if (!sizes.value.length) {
      selectedSize.value = '';
      return;
    }
    if (!sizes.value.includes(selectedSize.value)) {
      selectedSize.value = sizes.value[0];
    }
  },
);

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
      <p class="pill">In stock: {{ selectedVariant?.stock ?? 0 }}</p>
      <h1>{{ product.name }}</h1>
      <p class="detail-copy">
        {{ product.description || 'Crafted with tailored lines and structured ease.' }}
      </p>
      <div class="detail-options">
        <label class="label">Color</label>
        <div class="options">
          <button
            v-for="color in colors"
            :key="color.id || color.name || color"
            class="chip"
            :class="{ active: selectedColor === (color.name || color) }"
            type="button"
            @click="selectedColor = color.name || color"
          >
            <span
              v-if="color.hex"
              class="swatch"
              :style="{ backgroundColor: color.hex }"
            ></span>
            {{ color.name || color }}
          </button>
        </div>
        <label class="label">Size</label>
        <div class="options">
          <button
            v-for="size in sizes"
            :key="size"
            class="chip"
            :class="{ active: selectedSize === size }"
            type="button"
            @click="selectedSize = size"
          >
            {{ size }}
          </button>
        </div>
      </div>
      <div class="detail-meta">
        <div>
          <span class="label">Price</span>
          <div class="price">{{ store.formatCurrency(product.price) }}</div>
        </div>
        <div>
          <span class="label">SKU</span>
          <div>
            {{ selectedVariant?.sku || product.sku || 'TL-ESSENTIAL' }}
          </div>
        </div>
      </div>
      <div class="detail-actions">
        <button
          class="btn btn-primary"
          :disabled="!selectedVariant"
          @click="store.addToCart(product, selectedVariant)"
        >
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

<style scoped>
.detail-options {
  margin-top: 18px;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0 16px;
}

.chip {
  border: 1px solid var(--line, #2b2d33);
  background: transparent;
  color: inherit;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.chip.active {
  background: #f2f3f5;
  color: #121212;
}

.swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-right: 6px;
  vertical-align: middle;
}
</style>
