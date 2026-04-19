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
        URL de imagen
        <input v-model.trim="form.imageUrl" type="url" placeholder="https://..." />
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
            <th>Imagen</th>
            <th>Posicion</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleRows" :key="row.id">
            <td>
              <div class="name-cell" :style="{ paddingLeft: `${row.depth * 18}px` }">
                <button
                  v-if="row.hasChildren"
                  class="btn btn-ghost btn-icon"
                  type="button"
                  @click="toggleChildren(row.id)"
                >
                  {{ isExpanded(row.id) ? '▾' : '▸' }}
                </button>
                <span v-else class="spacer"></span>
                <template v-if="editingId === row.id">
                  <input v-model="editForm.name" required />
                </template>
                <template v-else>
                  {{ row.name }}
                </template>
              </div>
            </td>
            <td>{{ row.slug }}</td>
            <td>
              <template v-if="editingId === row.id">
                <select v-model="editForm.parentId">
                  <option value="">Sin padre</option>
                  <option
                    v-for="option in parentOptions(row.id)"
                    :key="option.id"
                    :value="option.id"
                  >
                    {{ option.name }}
                  </option>
                </select>
              </template>
              <template v-else>
                {{ parentName(row.parentId) }}
              </template>
            </td>
            <td class="image-cell">
              <template v-if="editingId === row.id">
                <input v-model.trim="editForm.imageUrl" type="url" placeholder="https://..." />
              </template>
              <template v-else>
                <a
                  v-if="row.imageUrl"
                  :href="row.imageUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="image-link"
                >
                  Ver imagen
                </a>
                <span v-else>-</span>
              </template>
            </td>
            <td>
              <template v-if="editingId === row.id">
                <input v-model.number="editForm.position" type="number" min="0" />
              </template>
              <template v-else>
                {{ row.position ?? 0 }}
              </template>
            </td>
            <td>
              <span class="pill" :class="{ muted: !isActive(row) }">
                {{ isActive(row) ? 'Activa' : 'Bloqueada' }}
              </span>
            </td>
            <td class="actions">
              <template v-if="editingId === row.id">
                <button
                  class="btn btn-ghost"
                  type="button"
                  :disabled="savingEdit"
                  @click="saveEdit(row)"
                >
                  Guardar
                </button>
                <button class="btn btn-ghost" type="button" :disabled="savingEdit" @click="cancelEdit">
                  Cancelar
                </button>
              </template>
              <template v-else>
                <button class="btn btn-ghost" type="button" @click="startEdit(row)">
                  Editar
                </button>
                <button
                  class="btn btn-ghost"
                  type="button"
                  :disabled="togglingId === row.id"
                  @click="toggleCategory(row)"
                >
                  {{ isActive(row) ? 'Bloquear' : 'Reactivar' }}
                </button>
              </template>
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
const { apiHeaders } = useAdminContext();
const saving = ref(false);
const message = ref('');
const togglingId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const savingEdit = ref(false);
const expandedIds = ref<Set<string>>(new Set());

const editForm = reactive({
  name: '',
  parentId: '',
  imageUrl: '',
  position: 0,
});

type CategoryNode = Category & { children: CategoryNode[] };
type CategoryRow = Category & { depth: number; hasChildren: boolean };

const { data, refresh } = await useFetch<Category[]>('/admin/categories', {
  baseURL: config.public.apiUrl,
  server: false,
  headers: apiHeaders,
});

const flattenCategories = (items: Category[]) => {
  const rows: Category[] = [];
  const visit = (category: Category) => {
    rows.push(category);
    if (Array.isArray(category.children)) {
      category.children.forEach((child) => visit(child));
    }
  };
  items.forEach((category) => visit(category));
  return rows;
};

const categoriesTree = computed(() => data.value ?? []);
const categories = computed(() => flattenCategories(categoriesTree.value));

const categoryTree = computed<CategoryNode[]>(() => {
  const byId = new Map<string, CategoryNode>();
  categories.value.forEach((category) => {
    byId.set(category.id, { ...category, children: [] });
  });

  const roots: CategoryNode[] = [];
  categories.value.forEach((category) => {
    const node = byId.get(category.id);
    if (!node) return;
    if (category.parentId) {
      const parent = byId.get(category.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  const sortChildren = (nodes: CategoryNode[]) => {
    nodes.sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name),
    );
    nodes.forEach((node) => sortChildren(node.children));
  };
  sortChildren(roots);
  return roots;
});

const visibleRows = computed<CategoryRow[]>(() => {
  const rows: CategoryRow[] = [];
  const visit = (node: CategoryNode, depth: number) => {
    rows.push({
      ...node,
      depth,
      hasChildren: node.children.length > 0,
    });
    if (expandedIds.value.has(node.id)) {
      node.children.forEach((child) => visit(child, depth + 1));
    }
  };
  categoryTree.value.forEach((root) => visit(root, 0));
  return rows;
});

const form = reactive({
  name: '',
  slug: '',
  parentId: '',
  imageUrl: '',
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
        imageUrl: form.imageUrl || undefined,
        position: form.position || 0,
      },
    });
    message.value = 'Categoria creada.';
    form.name = '';
    form.slug = '';
    form.parentId = '';
    form.imageUrl = '';
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

const startEdit = (category: Category) => {
  editingId.value = category.id;
  editForm.name = category.name;
  editForm.parentId = category.parentId ?? '';
  editForm.imageUrl = category.imageUrl ?? '';
  editForm.position = category.position ?? 0;
};

const cancelEdit = () => {
  editingId.value = null;
};

const saveEdit = async (category: Category) => {
  if (!editForm.name.trim()) {
    message.value = 'El nombre es obligatorio.';
    return;
  }
  message.value = '';
  savingEdit.value = true;
  try {
    await $fetch(`/admin/categories/${category.id}`, {
      baseURL: config.public.apiUrl,
      method: 'PATCH',
      headers: apiHeaders.value,
      body: {
        name: editForm.name.trim(),
        parentId: editForm.parentId || null,
        imageUrl: editForm.imageUrl || null,
        position: editForm.position || 0,
      },
    });
    await refresh();
    editingId.value = null;
  } catch (error) {
    message.value = 'No se pudo actualizar la categoria.';
  } finally {
    savingEdit.value = false;
  }
};

const isActive = (category: Category) => category.isActive !== false;

const toggleChildren = (categoryId: string) => {
  const next = new Set(expandedIds.value);
  if (next.has(categoryId)) {
    next.delete(categoryId);
  } else {
    next.add(categoryId);
  }
  expandedIds.value = next;
};

const isExpanded = (categoryId: string) => expandedIds.value.has(categoryId);

const parentOptions = (categoryId: string) =>
  categories.value.filter((category) => category.id !== categoryId);

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

.name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-icon {
  padding: 4px 6px;
  min-width: 26px;
  line-height: 1;
}

.spacer {
  display: inline-block;
  width: 26px;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.image-cell {
  min-width: 120px;
}

.image-link {
  color: var(--primary);
  text-decoration: none;
}
</style>
