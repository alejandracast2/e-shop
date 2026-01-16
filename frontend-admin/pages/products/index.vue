<template>
  <section class="fade-in">
    <div class="page-head">
      <div>
        <h1 class="title">Productos</h1>
        <p class="muted">Gestiona tu catalogo y el estado de cada articulo.</p>
      </div>
      <NuxtLink class="btn btn-primary" to="/products/new">Agregar producto</NuxtLink>
    </div>
  </section>

  <section class="card fade-in">
    <table class="table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>SKU</th>
          <th>Variantes</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products || []" :key="product.id">
          <td>
            <strong>{{ product.name }}</strong>
            <div class="muted">{{ product.description || 'Sin descripcion' }}</div>
          </td>
          <td>{{ product.sku || '--' }}</td>
          <td>{{ product.variants?.length ?? 0 }}</td>
          <td>${{ product.price.toFixed(2) }}</td>
          <td>{{ product.stock }}</td>
          <td>
            <span class="pill">{{ product.isActive ? 'Activo' : 'Archivado' }}</span>
          </td>
          <td class="actions">
            <NuxtLink class="btn btn-ghost" :to="`/products/${product.id}`">Editar</NuxtLink>
            <button class="btn btn-ghost" type="button" @click="toggleActive(product)">
              {{ product.isActive ? 'Archivar' : 'Reactivar' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import type { Product } from '~/types';

definePageMeta({ middleware: 'auth' });

const config = useRuntimeConfig();
const { authHeaders, hydrate } = useAuth();
hydrate();

const { data: products, refresh } = await useFetch<Product[]>('/products', {
  baseURL: config.public.apiUrl,
  server: false,
});

const toggleActive = async (product: Product) => {
  await $fetch(`/products/${product.id}`, {
    baseURL: config.public.apiUrl,
    method: 'PATCH',
    body: { isActive: !product.isActive },
    headers: authHeaders.value,
  });
  await refresh();
};
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

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
