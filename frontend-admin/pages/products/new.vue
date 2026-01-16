<template>
  <section class="fade-in">
    <h1 class="title">Nuevo producto</h1>
    <p class="muted">Completa los datos para publicar un nuevo articulo.</p>
  </section>

  <section class="card fade-in">
    <form class="form" @submit.prevent="createProduct">
      <label>
        Nombre
        <input v-model="form.name" required />
      </label>
      <label>
        SKU
        <input v-model="form.sku" />
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
        Imagen (URL)
        <input v-model="form.imageUrl" />
      </label>
      <button class="btn btn-primary" type="submit" :disabled="isSaving">
        {{ isSaving ? 'Guardando...' : 'Crear producto' }}
      </button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const config = useRuntimeConfig();
const router = useRouter();
const isSaving = ref(false);
const errorMessage = ref('');
const { authHeaders, hydrate } = useAuth();
hydrate();

const form = reactive({
  name: '',
  sku: '',
  description: '',
  price: 0,
  stock: 0,
  imageUrl: '',
});

const createProduct = async () => {
  isSaving.value = true;
  errorMessage.value = '';
  try {
    await $fetch('/products', {
      baseURL: config.public.apiUrl,
      method: 'POST',
      body: {
        name: form.name,
        sku: form.sku || undefined,
        description: form.description || undefined,
        price: form.price,
        stock: form.stock,
        imageUrl: form.imageUrl || undefined,
      },
      headers: authHeaders.value,
    });
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
textarea {
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
