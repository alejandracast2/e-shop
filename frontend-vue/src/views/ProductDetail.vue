<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '../store';

const store = useStore();
const route = useRoute();
const router = useRouter();
const product = ref(null);
const loadError = ref('');

const productSlug = computed(() => route.params.slug);
const selectedOptions = ref({});

async function load() {
  loadError.value = '';
  try {
    product.value = await store.loadProduct(productSlug.value);
  } catch (error) {
    loadError.value = error.message || 'Product not found.';
  }
}

const variants = computed(() => product.value?.variants || []);

function getVariantOptionId(variant, axisId) {
  const attr = variant.attributes?.find(
    (value) => value.attributeDefinitionId === axisId
  );
  return attr?.valueOption?.id || null;
}

const variantAxes = computed(() => {
  const axes = new Map();
  for (const variant of variants.value) {
    for (const attr of variant.attributes || []) {
      const definition = attr.attributeDefinition;
      const option = attr.valueOption;
      if (!definition?.isVariantAxis || !option) {
        continue;
      }
      if (!axes.has(definition.id)) {
        axes.set(definition.id, {
          id: definition.id,
          code: definition.code,
          name: definition.name,
          options: new Map()
        });
      }
      axes.get(definition.id).options.set(option.id, option.value);
    }
  }

  return Array.from(axes.values()).map((axis) => ({
    id: axis.id,
    code: axis.code,
    name: axis.name,
    options: Array.from(axis.options.entries()).map(([id, label]) => ({
      id,
      label
    }))
  }));
});

const selectedVariant = computed(() => {
  if (!variants.value.length) {
    return null;
  }
  if (!variantAxes.value.length) {
    return variants.value[0];
  }
  return (
    variants.value.find((variant) =>
      variantAxes.value.every((axis) => {
        const optionId = selectedOptions.value[axis.id];
        if (!optionId) {
          return false;
        }
        return getVariantOptionId(variant, axis.id) === optionId;
      })
    ) || null
  );
});

const stockLabel = computed(() => {
  const stock = selectedVariant.value?.availableStock;
  return typeof stock === 'number' ? stock : 'N/A';
});

const canAddToCart = computed(() => {
  if (!selectedVariant.value) {
    return false;
  }
  const stock = selectedVariant.value.availableStock;
  if (typeof stock === 'number') {
    return stock > 0;
  }
  return true;
});

function setDefaultsFromVariant(variant) {
  if (!variant) {
    return;
  }
  const next = {};
  for (const attr of variant.attributes || []) {
    if (attr.attributeDefinition?.isVariantAxis && attr.valueOption?.id) {
      next[attr.attributeDefinition.id] = attr.valueOption.id;
    }
  }
  selectedOptions.value = next;
}

function isOptionAvailable(axisId, optionId) {
  if (!variants.value.length) {
    return false;
  }
  return variants.value.some((variant) => {
    const stock = variant.availableStock;
    if (typeof stock === 'number' && stock <= 0) {
      return false;
    }
    if (getVariantOptionId(variant, axisId) !== optionId) {
      return false;
    }
    return variantAxes.value.every((axis) => {
      if (axis.id === axisId) {
        return true;
      }
      const selected = selectedOptions.value[axis.id];
      if (!selected) {
        return true;
      }
      return getVariantOptionId(variant, axis.id) === selected;
    });
  });
}

watch(product, (next) => {
  if (next) {
    setDefaultsFromVariant(variants.value[0]);
  }
});

watch(productSlug, () => {
  if (productSlug.value) {
    load();
  }
}, { immediate: true });
</script>

<template>
  <section class="detail" v-if="product">
    <div class="detail-media">
      <img
        v-if="product.imageUrl"
        :src="product.imageUrl"
        :alt="product.title"
      />
      <div v-else class="card-image">THREADLINE</div>
    </div>
    <div class="detail-content">
      <p class="pill">Stock: {{ stockLabel }}</p>
      <h1>{{ product.title }}</h1>
      <p class="detail-copy">
        {{ product.description || 'Crafted with tailored lines and structured ease.' }}
      </p>
      <div class="detail-meta">
        <div>
          <span class="label">Price</span>
          <div class="price">
            {{ store.formatCurrency(selectedVariant?.price ?? product.displayPrice) }}
          </div>
        </div>
        <div>
          <span class="label">SKU</span>
          <div>{{ selectedVariant?.sku || 'TL-ESSENTIAL' }}</div>
        </div>
      </div>
      <div v-if="variantAxes.length" class="detail-options">
        <div v-for="axis in variantAxes" :key="axis.id" class="option-group">
          <span class="label">{{ axis.name }}</span>
          <div class="option-grid">
            <button
              v-for="option in axis.options"
              :key="option.id"
              type="button"
              class="option-btn"
              :class="{ selected: selectedOptions[axis.id] === option.id }"
              :disabled="!isOptionAvailable(axis.id, option.id)"
              @click="selectedOptions[axis.id] = option.id"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
      <div class="detail-actions">
        <button
          class="btn btn-primary"
          :disabled="!canAddToCart"
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
