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
          <th>Categoria</th>
          <th>SKU</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products || []" :key="product.id">
          <td>
            <strong>{{ product.title }}</strong>
            <div class="muted">{{ product.description || 'Sin descripcion' }}</div>
          </td>
          <td>
            <div>{{ product.category?.name || 'Sin categoria' }}</div>
            <div class="muted">{{ product.brand || '' }}</div>
          </td>
          <td>{{ primaryVariant(product)?.sku || '--' }}</td>
          <td>
            <span v-if="primaryVariant(product)">
              ${{ primaryVariant(product)?.price.toFixed(2) }}
            </span>
            <span v-else>--</span>
          </td>
          <td>{{ totalStock(product) }}</td>
          <td>
            <span class="pill">{{ product.status }}</span>
          </td>
          <td class="actions">
            <NuxtLink class="btn btn-ghost" :to="`/products/${product.id}`">Editar</NuxtLink>
            <button class="btn btn-ghost" type="button" @click="toggleActive(product)">
              {{ product.status === 'active' ? 'Archivar' : 'Reactivar' }}
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

const apiHeaders = computed(() => ({
  ...authHeaders.value,
  'x-store-slug': config.public.storeSlug,
}));

const { data: products, refresh } = await useFetch<Product[]>('/admin/products', {
  baseURL: config.public.apiUrl,
  server: false,
  headers: apiHeaders,
});

const toggleActive = async (product: Product) => {
  const nextStatus = product.status === 'active' ? 'archived' : 'active';
  await $fetch(`/admin/products/${product.id}`, {
    baseURL: config.public.apiUrl,
    method: 'PATCH',
    body: { status: nextStatus },
    headers: apiHeaders.value,
  });
  await refresh();
};

const primaryVariant = (product: Product) => product.variants?.[0] ?? null;
const totalStock = (product: Product) =>
  product.variants?.reduce(
    (sum, variant) => sum + (variant.availableStock ?? 0),
    0,
  ) ?? 0;
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
