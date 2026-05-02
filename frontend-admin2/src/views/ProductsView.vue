<script setup>
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/formatters'
import { toErrorMessage } from '@/lib/api'
import { formatProductTags } from '@/utils/productTags'

const auth = useAuthStore()
const admin = useAdminStore()

const loading = ref(false)
const errorMessage = ref('')
const actionError = ref('')
const actionLoadingId = ref('')
const products = ref([])
const search = ref('')
const statusFilter = ref('all')

const loadProducts = async () => {
  if (!auth.isAuthenticated) return

  loading.value = true
  errorMessage.value = ''

  try {
    const payload = await admin.authorizedRequest('/admin/products')
    products.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudieron cargar los productos.')
  } finally {
    loading.value = false
  }
}

watch(
  () => admin.requestScopeKey,
  () => {
    void loadProducts()
  },
  { immediate: true },
)

const primaryVariant = (product) => product.variants?.[0] || null

const totalStock = (product) =>
  (product.variants || []).reduce((sum, variant) => sum + Number(variant.availableStock || 0), 0)

const filteredProducts = computed(() => {
  const needle = search.value.trim().toLowerCase()

  return products.value.filter((product) => {
    const matchesStatus = statusFilter.value === 'all' || product.status === statusFilter.value
    if (!matchesStatus) return false

    if (!needle) return true

    const candidate = [
      product.title,
      product.brand,
      product.category?.name,
      formatProductTags(product.tags),
      primaryVariant(product)?.sku,
      product.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return candidate.includes(needle)
  })
})

const toggleActive = async (product) => {
  actionLoadingId.value = product.id
  actionError.value = ''

  try {
    await admin.authorizedRequest(`/admin/products/${product.id}`, {
      method: 'PATCH',
      body: {
        status: product.status === 'active' ? 'archived' : 'active',
      },
    })

    await loadProducts()
  } catch (error) {
    actionError.value = toErrorMessage(error, 'No se pudo actualizar el producto.')
  } finally {
    actionLoadingId.value = ''
  }
}
</script>

<template>
  <PageHeader title="Productos" description="Gestiona catalogo, visibilidad y datos clave por variante.">
    <template #actions>
      <RouterLink class="btn btn-primary" :to="{ name: 'product-create' }">Agregar producto</RouterLink>
    </template>
  </PageHeader>

  <div v-if="errorMessage" class="status-message status-message--error fade-in">{{ errorMessage }}</div>
  <div v-if="actionError" class="status-message status-message--error fade-in">{{ actionError }}</div>

  <section class="panel fade-in">
    <div class="field-grid">
      <label class="field">
        <span>Buscar</span>
        <input v-model.trim="search" type="text" placeholder="Titulo, marca, categoria o SKU" />
      </label>

      <label class="field">
        <span>Estado</span>
        <select v-model="statusFilter">
          <option value="all">Todos</option>
          <option value="active">active</option>
          <option value="draft">draft</option>
          <option value="archived">archived</option>
        </select>
      </label>
    </div>
  </section>

  <section v-if="loading" class="panel fade-in">
    <p class="muted">Cargando productos...</p>
  </section>

  <section v-else class="panel fade-in">
    <div v-if="filteredProducts.length" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoria</th>
            <th>SKU</th>
            <th>Precio</th>
            <th>Etiquetas</th>
            <th>Stock</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.id">
            <td>
              <strong>{{ product.title }}</strong>
              <div class="muted">{{ product.description || 'Sin descripcion' }}</div>
            </td>
            <td>
              <div>{{ product.category?.name || 'Sin categoria' }}</div>
              <div class="muted">{{ product.brand || 'Sin marca' }}</div>
            </td>
            <td>{{ primaryVariant(product)?.sku || '--' }}</td>
            <td>{{ primaryVariant(product) ? formatCurrency(primaryVariant(product).price) : '--' }}</td>
            <td>
              <span v-if="product.tags?.length">{{ formatProductTags(product.tags) }}</span>
              <span v-else class="muted">--</span>
            </td>
            <td>{{ totalStock(product) }}</td>
            <td><span class="pill">{{ product.status }}</span></td>
            <td>
              <div class="actions-row">
                <RouterLink class="btn btn-ghost" :to="{ name: 'product-edit', params: { id: product.id } }">
                  Editar
                </RouterLink>
                <button
                  class="btn btn-ghost"
                  type="button"
                  :disabled="actionLoadingId === product.id"
                  @click="toggleActive(product)"
                >
                  {{ product.status === 'active' ? 'Archivar' : 'Reactivar' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">No hay productos que coincidan con el filtro actual.</div>
  </section>
</template>
