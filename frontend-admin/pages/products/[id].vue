<template>
  <section class="fade-in">
    <h1 class="title">Editar producto</h1>
    <p class="muted">Actualiza precio, stock o visibilidad del articulo.</p>
  </section>

  <section class="card fade-in">
    <div v-if="pending" class="muted">Cargando...</div>
    <div v-else-if="error" class="error">Producto no encontrado.</div>
    <form v-else class="form" @submit.prevent="updateProduct">
      <label class="full">
        Titulo
        <input v-model="form.title" required />
      </label>
      <label>
        Slug
        <input v-model="form.slug" required />
      </label>
      <label>
        Marca
        <input v-model="form.brand" />
      </label>
      <label>
        SKU
        <input v-model="form.sku" />
      </label>
      <label>
        Categoria
        <select v-model="form.categoryId">
          <option value="">Sin categoria</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </label>
      <label>
        Tipo de producto
        <select v-model="form.productTypeId">
          <option value="">Sin tipo</option>
          <option v-for="type in productTypes" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </select>
      </label>
      <label class="full">
        Descripcion
        <textarea v-model="form.description" rows="3" />
      </label>
      <label>
        Precio
        <input v-model.number="form.price" type="number" min="0" step="0.01" required />
      </label>
      <label>
        Stock
        <input v-model.number="form.stock" type="number" min="0" required />
      </label>
      <label class="full">
        Estado
        <select v-model="form.status">
          <option value="active">active</option>
          <option value="draft">draft</option>
          <option value="archived">archived</option>
        </select>
      </label>
      <button class="btn btn-primary" type="submit" :disabled="isSaving">
        {{ isSaving ? 'Guardando...' : 'Guardar cambios' }}
      </button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
import type { Category, Product, ProductType } from '~/types';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const config = useRuntimeConfig();
const isSaving = ref(false);
const errorMessage = ref('');
const { authHeaders, hydrate } = useAuth();
hydrate();

const apiHeaders = computed(() => ({
  ...authHeaders.value,
  'x-store-slug': config.public.storeSlug,
}));

const { data: categoryData } = await useFetch<Category[]>('/admin/categories', {
  baseURL: config.public.apiUrl,
  server: false,
  headers: apiHeaders,
});
const { data: productTypeData } = await useFetch<ProductType[]>(
  '/admin/product-types',
  {
    baseURL: config.public.apiUrl,
    server: false,
    headers: apiHeaders,
  },
);

const categories = computed(() => categoryData.value ?? []);
const productTypes = computed(() => productTypeData.value ?? []);

const { data: product, pending, error } = await useFetch<Product>(
  `/admin/products/${route.params.id}`,
  { baseURL: config.public.apiUrl, server: false, headers: apiHeaders },
);

const form = reactive({
  title: '',
  slug: '',
  brand: '',
  sku: '',
  categoryId: '',
  productTypeId: '',
  description: '',
  price: 0,
  stock: 0,
  status: 'active',
});

const primaryVariantId = computed(
  () => product.value?.variants?.[0]?.id ?? null,
);

watch(
  () => product.value,
  (value) => {
    if (!value) return;
    const variant = value.variants?.[0];
    form.title = value.title;
    form.slug = value.slug;
    form.description = value.description || '';
    form.status = value.status || 'active';
    form.brand = value.brand || '';
    form.categoryId = value.category?.id || '';
    form.productTypeId = value.productTypeId || '';
    form.sku = variant?.sku || '';
    form.price = variant?.price ?? 0;
    form.stock = variant?.availableStock ?? 0;
  },
  { immediate: true },
);

const updateProduct = async () => {
  isSaving.value = true;
  errorMessage.value = '';
  try {
    await $fetch(`/admin/products/${route.params.id}`, {
      baseURL: config.public.apiUrl,
      method: 'PATCH',
      body: {
        title: form.title,
        slug: form.slug,
        brand: form.brand || undefined,
        description: form.description || undefined,
        status: form.status,
        categoryId: form.categoryId || undefined,
        productTypeId: form.productTypeId || undefined,
      },
      headers: apiHeaders.value,
    });

    if (primaryVariantId.value) {
      await $fetch(`/admin/variants/${primaryVariantId.value}`, {
        baseURL: config.public.apiUrl,
        method: 'PATCH',
        body: {
          sku: form.sku || undefined,
          price: form.price,
        },
        headers: apiHeaders.value,
      });

      await $fetch(`/admin/inventory/variants/${primaryVariantId.value}/stock`, {
        baseURL: config.public.apiUrl,
        method: 'POST',
        body: { onHand: form.stock },
        headers: apiHeaders.value,
      });
    }
  } catch (err) {
    errorMessage.value = 'No se pudieron guardar los cambios.';
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.form {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

label.full {
  grid-column: 1 / -1;
}

input,
textarea,
select {
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 10px 12px;
  font-family: inherit;
}

.error {
  color: #b91c1c;
}
</style>
