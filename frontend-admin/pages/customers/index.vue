<template>
  <section class="fade-in">
    <h1 class="title">Clientes</h1>
    <p class="muted">Listado de compradores registrados en el sistema.</p>
  </section>

  <section class="card fade-in">
    <table class="table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Telefono</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="customer in customers || []" :key="customer.id">
          <td>{{ customer.fullName }}</td>
          <td>{{ customer.email }}</td>
          <td>{{ customer.phone || '--' }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import type { Customer } from '~/types';

definePageMeta({ middleware: 'auth' });

const config = useRuntimeConfig();
const { authHeaders, hydrate } = useAuth();
hydrate();

const apiHeaders = computed(() => ({
  ...authHeaders.value,
  'x-store-slug': config.public.storeSlug,
}));

const { data: customers } = await useFetch<Customer[]>('/admin/customers', {
  baseURL: config.public.apiUrl,
  server: false,
  headers: apiHeaders,
});
</script>

<style scoped>
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
