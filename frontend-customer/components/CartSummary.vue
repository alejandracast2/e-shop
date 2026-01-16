<template>
  <div class="summary card">
    <h3>Resumen</h3>
    <div v-if="items.length" class="summary-items">
      <div v-for="item in items" :key="item.productId" class="summary-row">
        <span>{{ item.name }} x{{ item.quantity }}</span>
        <span>${{ (item.price * item.quantity).toFixed(2) }}</span>
      </div>
    </div>
    <p v-else class="empty">Tu carrito esta vacio.</p>
    <div class="summary-total">
      <span>Total</span>
      <span>${{ total.toFixed(2) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CartItem } from '~/composables/useCart';

defineProps<{
  items: CartItem[];
  total: number;
}>();
</script>

<style scoped>
.summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h3 {
  margin: 0;
  font-size: 18px;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--muted);
}

.summary-total {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
}

.empty {
  margin: 0;
  color: var(--muted);
}
</style>
