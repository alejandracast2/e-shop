<template>
  <section class="fade-in">
    <h1 class="title">Nuevo producto</h1>
    <p class="muted">Completa los datos para publicar un nuevo articulo.</p>
  </section>

  <section class="card fade-in">
    <form class="form" @submit.prevent="createProduct">
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
        Codigo de barras
        <input v-model="form.barcode" />
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
        Stock inicial
        <input v-model.number="form.stock" type="number" min="0" required />
      </label>
      <label>
        Estado
        <select v-model="form.status">
          <option value="active">active</option>
          <option value="draft">draft</option>
          <option value="archived">archived</option>
        </select>
      </label>
      <button class="btn btn-primary" type="submit" :disabled="isSaving">
        {{ isSaving ? 'Guardando...' : 'Crear producto' }}
      </button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
import type { Category, Product, ProductType } from '~/types';

definePageMeta({ middleware: 'auth' });

const config = useRuntimeConfig();
const router = useRouter();
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

const form = reactive({
  title: '',
  slug: '',
  brand: '',
  sku: '',
  barcode: '',
  categoryId: '',
  productTypeId: '',
  description: '',
  price: 0,
  stock: 0,
  status: 'active',
});

const createProduct = async () => {
  isSaving.value = true;
  errorMessage.value = '';
  try {
    const response = await $fetch<Product>('/admin/products', {
      baseURL: config.public.apiUrl,
      method: 'POST',
      headers: apiHeaders.value,
      body: {
        title: form.title,
        slug: form.slug,
        brand: form.brand || undefined,
        description: form.description || undefined,
        status: form.status,
        categoryId: form.categoryId || undefined,
        productTypeId: form.productTypeId || undefined,
        variants: [
          {
            sku: form.sku || undefined,
            barcode: form.barcode || undefined,
            price: form.price,
            isActive: true,
          },
        ],
      },
    });

    const variantId = response.variants?.[0]?.id;
    if (variantId) {
      await $fetch(`/admin/inventory/variants/${variantId}/stock`, {
        baseURL: config.public.apiUrl,
        method: 'POST',
        headers: apiHeaders.value,
        body: { onHand: form.stock },
      });
    }

    await router.push('/products');
  } catch (error) {
    errorMessage.value = 'No se pudo crear el producto.';
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
  grid-column: 1 / -1;
}
</style>
