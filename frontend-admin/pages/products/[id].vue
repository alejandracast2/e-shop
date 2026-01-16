<template>
  <section class="fade-in">
    <h1 class="title">Editar producto</h1>
    <p class="muted">Actualiza precio, stock o visibilidad del articulo.</p>
  </section>

  <section class="card fade-in">
    <div v-if="pending" class="muted">Cargando...</div>
    <div v-else-if="error" class="error">Producto no encontrado.</div>
    <form v-else class="form" @submit.prevent="updateProduct">
      <label>
        Nombre
        <input v-model="form.name" required />
      </label>
      <label>
        SKU
        <input v-model="form.sku" />
      </label>
      <label>
        Categoria
        <input v-model="form.category" />
      </label>
      <label class="full">
        Descripcion
        <textarea v-model="form.description" rows="3" />
      </label>
      <label>
        Precio
        <input v-model.number="form.price" type="number" min="0" step="0.01" required />
      </label>
      <div class="full variants">
        <span class="muted">Variantes</span>
        <div v-if="product?.variants?.length" class="variant-list">
          <div v-for="variant in product.variants" :key="variant.id" class="variant-row">
            <span>{{ variant.size }}</span>
            <span>{{ variant.color?.name || variant.color }}</span>
            <span>{{ variant.stock }} uds</span>
          </div>
        </div>
        <div v-else class="muted">Sin variantes registradas.</div>
      </div>
      <label class="full">
        Imagen (URL)
        <input v-model="form.imageUrl" />
      </label>
      <label class="toggle">
        <input v-model="form.isActive" type="checkbox" />
        Activo en tienda
      </label>
      <button class="btn btn-primary" type="submit" :disabled="isSaving">
        {{ isSaving ? 'Guardando...' : 'Guardar cambios' }}
      </button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
import type { Product } from '~/types';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const config = useRuntimeConfig();
const isSaving = ref(false);
const errorMessage = ref('');
const { authHeaders, hydrate } = useAuth();
hydrate();

const { data: product, pending, error } = await useFetch<Product>(
  `/products/${route.params.id}`,
  { baseURL: config.public.apiUrl, server: false },
);

const form = reactive({
  name: '',
  sku: '',
  description: '',
  price: 0,
  category: '',
  imageUrl: '',
  isActive: true,
});

watch(
  () => product.value,
  (value) => {
    if (!value) return;
    form.name = value.name;
    form.sku = value.sku || '';
    form.description = value.description || '';
    form.price = value.price;
    form.category = value.category?.name || '';
    form.imageUrl = value.imageUrl || '';
    form.isActive = value.isActive;
  },
  { immediate: true },
);

const updateProduct = async () => {
  isSaving.value = true;
  errorMessage.value = '';
  try {
    await $fetch(`/products/${route.params.id}`, {
      baseURL: config.public.apiUrl,
      method: 'PATCH',
      body: {
        name: form.name,
        sku: form.sku || undefined,
        description: form.description || undefined,
        price: form.price,
        category: form.category || undefined,
        imageUrl: form.imageUrl || undefined,
        isActive: form.isActive,
      },
      headers: authHeaders.value,
    });
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

.toggle {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  grid-column: 1 / -1;
}

.variants {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.variant-list {
  display: grid;
  gap: 6px;
}

.variant-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  color: var(--muted);
}

input,
textarea {
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 10px 12px;
  font-family: inherit;
}

.error {
  color: #b91c1c;
}
</style>
