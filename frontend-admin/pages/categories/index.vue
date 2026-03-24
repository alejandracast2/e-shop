<template>
  <section class="fade-in">
    <div class="page-head">
      <div>
        <h1 class="title">Categorias</h1>
        <p class="muted">Organiza el catalogo con categorias jerarquicas.</p>
      </div>
    </div>
  </section>

  <section class="grid grid-2 fade-in">
    <form class="card form" @submit.prevent="createCategory">
      <h3>Nueva categoria</h3>
      <label>
        Nombre
        <input v-model="form.name" required />
      </label>
      <label>
        Slug
        <input v-model="form.slug" required />
      </label>
      <label>
        Categoria padre
        <select v-model="form.parentId">
          <option value="">Sin padre</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </label>
      <label>
        Posicion
        <input v-model.number="form.position" type="number" min="0" />
      </label>
      <button class="btn btn-primary" type="submit" :disabled="saving">
        {{ saving ? 'Guardando...' : 'Crear categoria' }}
      </button>
      <p v-if="message" class="muted">{{ message }}</p>
    </form>

    <div class="card">
      <h3>Listado</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Slug</th>
            <th>Padre</th>
            <th>Posicion</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id">
            <td>{{ category.name }}</td>
            <td>{{ category.slug }}</td>
            <td>{{ parentName(category.parentId) }}</td>
            <td>{{ category.position ?? 0 }}</td>
            <td>
              <span class="pill" :class="{ muted: !isActive(category) }">
                {{ isActive(category) ? 'Activa' : 'Bloqueada' }}
              </span>
            </td>
            <td class="actions">
              <button
                class="btn btn-ghost"
                type="button"
                :disabled="togglingId === category.id"
                @click="toggleCategory(category)"
              >
                {{ isActive(category) ? 'Bloquear' : 'Reactivar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Category } from '~/types';

definePageMeta({ middleware: 'auth' });

const config = useRuntimeConfig();
const { authHeaders, hydrate } = useAuth();
hydrate();
const saving = ref(false);
const message = ref('');
const togglingId = ref<string | null>(null);

const apiHeaders = computed(() => ({
  ...authHeaders.value,
  'x-store-slug': config.public.storeSlug,
}));

const { data, refresh } = await useFetch<Category[]>('/admin/categories', {
  baseURL: config.public.apiUrl,
  server: false,
  headers: apiHeaders,
});

const categories = computed(() => data.value ?? []);

const form = reactive({
  name: '',
  slug: '',
  parentId: '',
  position: 0,
});

watch(
  () => form.name,
  (value) => {
    if (!form.slug) {
      form.slug = slugify(value);
    }
  },
);

const createCategory = async () => {
  message.value = '';
  saving.value = true;
  try {
    await $fetch('/admin/categories', {
      baseURL: config.public.apiUrl,
      method: 'POST',
      headers: apiHeaders.value,
      body: {
        name: form.name,
        slug: form.slug,
        parentId: form.parentId || undefined,
        position: form.position || 0,
      },
    });
    message.value = 'Categoria creada.';
    form.name = '';
    form.slug = '';
    form.parentId = '';
    form.position = 0;
    await refresh();
  } catch (error) {
    message.value = 'No se pudo crear la categoria.';
  } finally {
    saving.value = false;
  }
};

const toggleCategory = async (category: Category) => {
  message.value = '';
  togglingId.value = category.id;
  const nextState = !isActive(category);
  try {
    await $fetch(`/admin/categories/${category.id}`, {
      baseURL: config.public.apiUrl,
      method: 'PATCH',
      headers: apiHeaders.value,
      body: {
        isActive: nextState,
      },
    });
    await refresh();
  } catch (error) {
    message.value = 'No se pudo actualizar la categoria.';
  } finally {
    togglingId.value = null;
  }
};

const isActive = (category: Category) => category.isActive !== false;

const parentName = (parentId?: string | null) => {
  if (!parentId) return '-';
  return categories.value.find((category) => category.id === parentId)?.name ?? '-';
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 18px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

input,
select {
  border: 1px solid var(--outline);
  border-radius: 10px;
  padding: 8px 10px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid var(--outline);
}

.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
