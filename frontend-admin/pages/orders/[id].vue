<template>
  <section class="fade-in">
    <h1 class="title">Detalle de pedido</h1>
    <p class="muted">Actualiza status y revisa items comprados.</p>
  </section>

  <section class="grid grid-3 fade-in">
    <div class="card">
      <h3>Estado</h3>
      <label>
        Status
        <select v-model="form.status">
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="shipped">shipped</option>
          <option value="completed">completed</option>
          <option value="canceled">canceled</option>
        </select>
      </label>
      <label>
        Pago
        <select v-model="form.paymentStatus">
          <option value="unpaid">unpaid</option>
          <option value="paid">paid</option>
          <option value="refunded">refunded</option>
        </select>
      </label>
      <button class="btn btn-primary" type="button" @click="updateOrder">
        Guardar cambios
      </button>
      <p v-if="message" class="muted">{{ message }}</p>
    </div>

    <div class="card">
      <h3>Cliente</h3>
      <p><strong>{{ order?.customer.firstName }} {{ order?.customer.lastName }}</strong></p>
      <p class="muted">{{ order?.customer.email }}</p>
    </div>

    <div class="card">
      <h3>Total</h3>
      <p class="total">${{ Number(order?.total || 0).toFixed(2) }}</p>
      <p class="muted">Subtotal: ${{ Number(order?.subtotal || 0).toFixed(2) }}</p>
    </div>
  </section>

  <section class="card fade-in">
    <h3>Items</h3>
    <div v-if="order?.items?.length" class="items">
      <div v-for="item in order.items" :key="item.id" class="item-row">
        <div>
          <strong>{{ item.product.name }}</strong>
          <div class="muted">Cantidad: {{ item.quantity }}</div>
        </div>
        <div>${{ Number(item.lineTotal).toFixed(2) }}</div>
      </div>
    </div>
    <p v-else class="muted">No hay items registrados.</p>
  </section>
</template>

<script setup lang="ts">
import type { Order } from '~/types';

definePageMeta({ middleware: 'auth' });

const config = useRuntimeConfig();
const route = useRoute();
const message = ref('');
const { authHeaders, hydrate } = useAuth();
hydrate();

const { data: order, refresh } = await useFetch<Order>(`/orders/${route.params.id}`, {
  baseURL: config.public.apiUrl,
  server: false,
  headers: authHeaders.value,
});

const form = reactive({
  status: 'pending',
  paymentStatus: 'unpaid',
});

watch(
  () => order.value,
  (value) => {
    if (!value) return;
    form.status = value.status;
    form.paymentStatus = value.paymentStatus;
  },
  { immediate: true },
);

const updateOrder = async () => {
  message.value = '';
  await $fetch(`/orders/${route.params.id}`, {
    baseURL: config.public.apiUrl,
    method: 'PATCH',
    body: {
      status: form.status,
      paymentStatus: form.paymentStatus,
    },
    headers: authHeaders.value,
  });
  message.value = 'Cambios guardados.';
  await refresh();
};
</script>

<style scoped>
h3 {
  margin-top: 0;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 12px;
}

select {
  border: 1px solid var(--outline);
  border-radius: 10px;
  padding: 8px 10px;
}

.total {
  font-size: 24px;
  font-weight: 700;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--outline);
  padding-bottom: 10px;
}
</style>
