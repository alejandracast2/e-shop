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
        Categoria
        <input v-model="form.category" />
      </label>
      <label class="toggle">
        <input v-model="useSizes" type="checkbox" />
        Crear tallas por separado
      </label>
      <template v-if="useSizes">
        <div class="size-list full">
          <div v-for="(sizeItem, index) in form.sizes" :key="index" class="size-row">
            <input v-model="sizeItem.size" placeholder="Talla" />
            <input v-model="sizeItem.color" placeholder="Color" />
            <input v-model.number="sizeItem.stock" type="number" min="0" />
            <button
              class="btn btn-ghost"
              type="button"
              :disabled="form.sizes.length === 1"
              @click="removeSize(index)"
            >
              Quitar
            </button>
          </div>
          <button class="btn btn-ghost" type="button" @click="addSize">
            Agregar talla
          </button>
        </div>
      </template>
      <template v-else>
        <label>
          Talla
          <input v-model="form.size" />
        </label>
        <label>
          Color
          <input v-model="form.color" />
        </label>
        <label>
          Stock
          <input v-model.number="form.stock" type="number" min="0" required />
        </label>
      </template>
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

const useSizes = ref(false);
const form = reactive({
  name: '',
  sku: '',
  description: '',
  price: 0,
  category: '',
  size: '',
  color: '',
  stock: 0,
  imageUrl: '',
  sizes: [{ size: '', color: '', stock: 0 }],
});

const addSize = () => {
  form.sizes.push({ size: '', color: '', stock: 0 });
};

const removeSize = (index: number) => {
  if (form.sizes.length === 1) return;
  form.sizes.splice(index, 1);
};

const createProduct = async () => {
  isSaving.value = true;
  errorMessage.value = '';
  try {
    const basePayload = {
      name: form.name,
      sku: form.sku || undefined,
      description: form.description || undefined,
      price: form.price,
      category: form.category || undefined,
      imageUrl: form.imageUrl || undefined,
    };

    if (useSizes.value) {
      const sizes = form.sizes
        .map((item) => ({
          size: item.size.trim(),
          color: item.color.trim(),
          stock: item.stock,
        }))
        .filter((item) => item.size.length > 0 && item.color.length > 0);

      if (!sizes.length) {
        errorMessage.value = 'Agrega al menos una talla y color.';
        return;
      }

      await $fetch('/products', {
        baseURL: config.public.apiUrl,
        method: 'POST',
        body: {
          ...basePayload,
          variants: sizes,
        },
        headers: authHeaders.value,
      });
      await router.push('/products');
      return;
    }

    await $fetch('/products', {
      baseURL: config.public.apiUrl,
      method: 'POST',
      body: {
        ...basePayload,
        size: form.size || undefined,
        color: form.color || undefined,
        stock: form.stock,
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

.toggle {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  grid-column: 1 / -1;
}

.size-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.size-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  align-items: center;
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
