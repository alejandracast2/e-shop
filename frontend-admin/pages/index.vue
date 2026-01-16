<template>
  <section class="fade-in">
    <h1 class="title">Dashboard</h1>
    <p class="muted">
      Vista rapida de catalogo, pedidos y performance general.
    </p>
  </section>

  <section class="grid grid-3 fade-in">
    <StatCard
      label="Productos activos"
      :value="productCount"
      trend="+ inventario vivo"
      footer="Actualiza desde la vista Productos"
    />
    <StatCard
      label="Pedidos totales"
      :value="orderCount"
      trend="flujo continuo"
      footer="Revisa status en Pedidos"
    />
    <StatCard
      label="Ingresos"
      :value="`$${revenue.toFixed(2)}`"
      trend="ultimo periodo"
      footer="Total calculado por orden"
    />
  </section>

  <section class="grid grid-3 fade-in" style="margin-top: 22px;">
    <div class="card">
      <h3>Ultimos pedidos</h3>
      <div v-if="orders?.length" class="list">
        <div v-for="order in recentOrders" :key="order.id" class="list-row">
          <div>
            <strong>#{{ order.id }}</strong>
            <span class="muted">- {{ order.customer.firstName }}</span>
          </div>
          <span class="pill">{{ order.status }}</span>
        </div>
      </div>
      <p v-else class="muted">Sin pedidos aun.</p>
    </div>

    <div class="card">
      <h3>Productos con poco stock</h3>
      <div v-if="lowStock.length" class="list">
        <div v-for="product in lowStock" :key="product.id" class="list-row">
          <span>{{ product.name }}</span>
          <span class="pill">{{ product.stock }} uds</span>
        </div>
      </div>
      <p v-else class="muted">Stock saludable.</p>
    </div>

    <div class="card">
      <h3>Clientes recientes</h3>
      <div v-if="customers?.length" class="list">
        <div v-for="customer in recentCustomers" :key="customer.id" class="list-row">
          <span>{{ customer.firstName }} {{ customer.lastName }}</span>
          <span class="pill">{{ customer.email }}</span>
        </div>
      </div>
      <p v-else class="muted">Aun no hay clientes.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Customer, Order, Product } from '~/types';

definePageMeta({ middleware: 'auth' });

const config = useRuntimeConfig();
const { authHeaders, hydrate } = useAuth();
hydrate();

const { data: products } = await useFetch<Product[]>('/products', {
  baseURL: config.public.apiUrl,
  server: false,
});
const { data: orders } = await useFetch<Order[]>('/orders', {
  baseURL: config.public.apiUrl,
  server: false,
  headers: authHeaders.value,
});
const { data: customers } = await useFetch<Customer[]>('/customers', {
  baseURL: config.public.apiUrl,
  server: false,
  headers: authHeaders.value,
});

const productCount = computed(() => products.value?.length ?? 0);
const orderCount = computed(() => orders.value?.length ?? 0);
const revenue = computed(
  () => orders.value?.reduce((sum, order) => sum + Number(order.total), 0) ?? 0,
);

const recentOrders = computed(() => orders.value?.slice(0, 5) ?? []);
const lowStock = computed(
  () => products.value?.filter((product) => product.stock < 5).slice(0, 5) ?? [],
);
const recentCustomers = computed(() => customers.value?.slice(0, 5) ?? []);
</script>

<style scoped>
h3 {
  margin-top: 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
</style>
