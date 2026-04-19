<script setup>
import { computed, reactive, ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { buildCategoryTree, collectDescendantIds, createUniqueSlug, flattenCategories, slugify } from '@/utils/catalog'
import { toErrorMessage } from '@/lib/api'

const auth = useAuthStore()
const admin = useAdminStore()

const loading = ref(false)
const saving = ref(false)
const savingEdit = ref(false)
const togglingId = ref('')
const editingId = ref('')
const feedback = ref('')
const feedbackType = ref('success')
const categoriesRaw = ref([])
const expandedIds = ref(new Set())
const slugEditedManually = ref(false)

const form = reactive({
  name: '',
  slug: '',
  parentId: '',
  imageUrl: '',
  position: 0,
})

const editForm = reactive({
  name: '',
  parentId: '',
  imageUrl: '',
  position: 0,
})

const categories = computed(() => flattenCategories(categoriesRaw.value))
const categoryTree = computed(() => buildCategoryTree(categories.value))
const existingSlugs = computed(() => categories.value.map((category) => category.slug))

watch(
  () => form.name,
  (value) => {
    if (!slugEditedManually.value || !form.slug) {
      form.slug = resolveUniqueSlug(value)
    }
  },
)

watch(existingSlugs, () => {
  if (!slugEditedManually.value && form.name) {
    form.slug = resolveUniqueSlug(form.name)
  }
})

const loadCategories = async () => {
  if (!auth.isAuthenticated) return

  loading.value = true
  feedback.value = ''

  try {
    const payload = await admin.authorizedRequest('/admin/categories')
    categoriesRaw.value = Array.isArray(payload) ? payload : []
    expandedIds.value = new Set(categoriesRaw.value.map((category) => category.id))
  } catch (error) {
    feedback.value = toErrorMessage(error, 'No se pudieron cargar las categorias.')
    feedbackType.value = 'error'
  } finally {
    loading.value = false
  }
}

watch(
  () => admin.requestScopeKey,
  () => {
    void loadCategories()
  },
  { immediate: true },
)

const treeIndex = computed(() => {
  const index = new Map()

  const visit = (node) => {
    index.set(node.id, node)
    node.children.forEach(visit)
  }

  categoryTree.value.forEach(visit)
  return index
})

const visibleRows = computed(() => {
  const rows = []

  const visit = (node, depth) => {
    rows.push({
      ...node,
      depth,
      hasChildren: node.children.length > 0,
    })

    if (expandedIds.value.has(node.id)) {
      node.children.forEach((child) => visit(child, depth + 1))
    }
  }

  categoryTree.value.forEach((node) => visit(node, 0))
  return rows
})

const setFeedback = (message, type = 'success') => {
  feedback.value = message
  feedbackType.value = type
}

const resolveUniqueSlug = (value) =>
  createUniqueSlug(value, existingSlugs.value, { fallback: 'categoria' })

const normalizeSlugInput = (value) => slugify(value)

const handleSlugInput = (event) => {
  slugEditedManually.value = true
  form.slug = normalizeSlugInput(event.target.value)
}

const ensureUniqueFormSlug = () => {
  form.slug = resolveUniqueSlug(form.slug || form.name)
}

const resetForm = () => {
  form.name = ''
  form.slug = ''
  form.parentId = ''
  form.imageUrl = ''
  form.position = 0
  slugEditedManually.value = false
}

const createCategory = async () => {
  saving.value = true
  setFeedback('')

  try {
    ensureUniqueFormSlug()

    await admin.authorizedRequest('/admin/categories', {
      method: 'POST',
      body: {
        name: form.name,
        slug: form.slug,
        parentId: form.parentId || undefined,
        imageUrl: form.imageUrl || undefined,
        position: Number(form.position || 0),
      },
    })

    resetForm()
    setFeedback('Categoria creada.')
    await loadCategories()
  } catch (error) {
    setFeedback(toErrorMessage(error, 'No se pudo crear la categoria.'), 'error')
  } finally {
    saving.value = false
  }
}

const toggleChildren = (categoryId) => {
  const next = new Set(expandedIds.value)

  if (next.has(categoryId)) {
    next.delete(categoryId)
  } else {
    next.add(categoryId)
  }

  expandedIds.value = next
}

const isExpanded = (categoryId) => expandedIds.value.has(categoryId)
const isActive = (category) => category.isActive !== false

const toggleCategory = async (category) => {
  togglingId.value = category.id
  setFeedback('')

  try {
    await admin.authorizedRequest(`/admin/categories/${category.id}`, {
      method: 'PATCH',
      body: {
        isActive: !isActive(category),
      },
    })

    await loadCategories()
  } catch (error) {
    setFeedback(toErrorMessage(error, 'No se pudo actualizar la categoria.'), 'error')
  } finally {
    togglingId.value = ''
  }
}

const startEdit = (category) => {
  editingId.value = category.id
  editForm.name = category.name
  editForm.parentId = category.parentId || ''
  editForm.imageUrl = category.imageUrl || ''
  editForm.position = Number(category.position || 0)
}

const cancelEdit = () => {
  editingId.value = ''
}

const saveEdit = async (category) => {
  if (!editForm.name.trim()) {
    setFeedback('El nombre es obligatorio.', 'error')
    return
  }

  savingEdit.value = true
  setFeedback('')

  try {
    await admin.authorizedRequest(`/admin/categories/${category.id}`, {
      method: 'PATCH',
      body: {
        name: editForm.name.trim(),
        parentId: editForm.parentId || null,
        imageUrl: editForm.imageUrl || null,
        position: Number(editForm.position || 0),
      },
    })

    editingId.value = ''
    setFeedback('Categoria actualizada.')
    await loadCategories()
  } catch (error) {
    setFeedback(toErrorMessage(error, 'No se pudo actualizar la categoria.'), 'error')
  } finally {
    savingEdit.value = false
  }
}

const parentOptions = (categoryId) => {
  const node = treeIndex.value.get(categoryId)
  const blockedIds = node ? collectDescendantIds(node) : new Set()
  blockedIds.add(categoryId)

  return categories.value.filter((category) => !blockedIds.has(category.id))
}

const parentName = (parentId) => {
  if (!parentId) return '-'
  return categories.value.find((category) => category.id === parentId)?.name || '-'
}
</script>

<template>
  <PageHeader
    title="Categorias"
    description="Organiza el catalogo con relaciones jerarquicas y evita padres invalidos."
  />

  <div
    v-if="feedback"
    class="status-message fade-in"
    :class="feedbackType === 'error' ? 'status-message--error' : 'status-message--success'"
  >
    {{ feedback }}
  </div>

  <section v-if="loading" class="panel fade-in">
    <p class="muted">Cargando categorias...</p>
  </section>

  <section v-else class="grid-2 fade-in">
    <form class="panel" @submit.prevent="createCategory">
      <h2>Nueva categoria</h2>

      <div class="field-grid">
        <label class="field">
          <span>Nombre</span>
          <input v-model.trim="form.name" type="text" required />
        </label>

        <label class="field">
          <span>Slug</span>
          <input
            :value="form.slug"
            type="text"
            required
            @input="handleSlugInput"
            @blur="ensureUniqueFormSlug"
          />
        </label>

        <label class="field">
          <span>Categoria padre</span>
          <select v-model="form.parentId">
            <option value="">Sin padre</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>URL de imagen</span>
          <input v-model.trim="form.imageUrl" type="url" placeholder="https://..." />
        </label>

        <label class="field">
          <span>Posicion</span>
          <input v-model.number="form.position" type="number" min="0" />
        </label>
      </div>

      <div class="actions-row">
        <button class="btn btn-primary" type="submit" :disabled="saving">
          {{ saving ? 'Guardando...' : 'Crear categoria' }}
        </button>
      </div>
    </form>

    <article class="panel">
      <h2>Listado</h2>

      <div v-if="visibleRows.length" class="table-wrap">
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
                    class="btn btn-ghost btn-toggle"
                    type="button"
                    @click="toggleChildren(row.id)"
                  >
                    {{ isExpanded(row.id) ? '-' : '+' }}
                  </button>
                  <span v-else class="name-spacer"></span>

                  <template v-if="editingId === row.id">
                    <input v-model.trim="editForm.name" type="text" required />
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
                    <option v-for="option in parentOptions(row.id)" :key="option.id" :value="option.id">
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
                  {{ row.position || 0 }}
                </template>
              </td>
              <td>
                <span class="pill">{{ isActive(row) ? 'Activa' : 'Bloqueada' }}</span>
              </td>
              <td>
                <div class="actions-row">
                  <template v-if="editingId === row.id">
                    <button class="btn btn-ghost" type="button" :disabled="savingEdit" @click="saveEdit(row)">
                      Guardar
                    </button>
                    <button class="btn btn-ghost" type="button" :disabled="savingEdit" @click="cancelEdit">
                      Cancelar
                    </button>
                  </template>
                  <template v-else>
                    <button class="btn btn-ghost" type="button" @click="startEdit(row)">Editar</button>
                    <button
                      class="btn btn-ghost"
                      type="button"
                      :disabled="togglingId === row.id"
                      @click="toggleCategory(row)"
                    >
                      {{ isActive(row) ? 'Bloquear' : 'Reactivar' }}
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">Todavia no hay categorias cargadas.</div>
    </article>
  </section>
</template>

<style scoped>
h2 {
  margin-top: 0;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-toggle {
  min-width: 32px;
  min-height: 32px;
  padding: 4px 8px;
}

.name-spacer {
  width: 32px;
  flex: 0 0 32px;
}

.image-cell {
  min-width: 120px;
}

.image-link {
  color: var(--color-accent);
  text-decoration: none;
}
</style>
