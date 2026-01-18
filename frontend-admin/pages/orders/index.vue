<template>
  <section class="fade-in">
    <div class="page-head">
      <div>
        <h1 class="title">Pedidos</h1>
        <p class="muted">Monitorea estados y montos desde un solo lugar.</p>
      </div>
    </div>
  </section>

  <section class="card fade-in">
    <table class="table">
      <thead>
        <tr>
          <th>Orden</th>
          <th>Cliente</th>
          <th>Total</th>
          <th>Status</th>
          <th>Pago</th>
          <th>Fulfillment</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders || []" :key="order.id">
          <td>#{{ order.orderNumber }}</td>
          <td>{{ order.customer?.fullName || 'Sin cliente' }}</td>
          <td>${{ Number(order.totalAmount).toFixed(2) }}</td>
          <td><span class="pill">{{ order.status }}</span></td>
          <td><span class="pill">{{ order.paymentStatus }}</span></td>
          <td><span class="pill">{{ order.fulfillmentStatus || '-' }}</span></td>
          <td>
            <NuxtLink class="btn btn-ghost" :to="`/orders/${order.id}`">Ver</NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import type { Order } from '~/types';

definePageMeta({ middleware: 'auth' });

const config = useRuntimeConfig();
const { authHeaders, hydrate } = useAuth();
hydrate();
const apiHeaders = computed(() => ({
  ...authHeaders.value,
  'x-store-slug': config.public.storeSlug,
}));

const { data: orders } = await useFetch<Order[]>('/admin/orders', {
  baseURL: config.public.apiUrl,
  server: false,
  headers: apiHeaders,
});
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 18px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid var(--outline);
}
</style>
