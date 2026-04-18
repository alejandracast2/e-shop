<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import ProductForm from '@/components/ProductForm.vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { toErrorMessage } from '@/lib/api'
import { flattenCategoryOptions } from '@/utils/catalog'

const route = useRoute()
const auth = useAuthStore()
const admin = useAdminStore()

const loadingData = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const categoriesRaw = ref([])
const productTypes = ref([])
const product = ref(null)

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
})

const categoryOptions = computed(() => flattenCategoryOptions(categoriesRaw.value))
const primaryVariantId = computed(() => product.value?.variants?.[0]?.id || null)
const stockHint = computed(() =>
  auth.canManageInventory
    ? ''
    : 'Puedes editar los datos del producto, pero no el stock porque tu rol no administra inventario.',
)

const applyProductToForm = (value) => {
  if (!value) return

  const variant = value.variants?.[0] || {}
  form.title = value.title || ''
  form.slug = value.slug || ''
  form.brand = value.brand || ''
  form.sku = variant.sku || ''
  form.barcode = variant.barcode || ''
  form.categoryId = value.category?.id || ''
  form.productTypeId = value.productTypeId || ''
  form.description = value.description || ''
  form.price = Number(variant.price || 0)
  form.stock = Number(variant.availableStock || 0)
  form.status = value.status || 'active'
}

const loadDependencies = async () => {
  const [categoryPayload, typePayload] = await Promise.all([
    admin.authorizedRequest('/admin/categories'),
    admin.authorizedRequest('/admin/product-types'),
  ])

  categoriesRaw.value = Array.isArray(categoryPayload) ? categoryPayload : []
  productTypes.value = Array.isArray(typePayload) ? typePayload : []
}

const loadProduct = async () => {
  if (!auth.isAuthenticated) return

  loadingData.value = true
  errorMessage.value = ''
  successMessage.value = ''
  product.value = null

  try {
    await loadDependencies()
    product.value = await admin.authorizedRequest(`/admin/products/${route.params.id}`)
    applyProductToForm(product.value)
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudo cargar el producto.')
    product.value = null
  } finally {
    loadingData.value = false
  }
}

watch(
  () => [admin.requestScopeKey, route.params.id],
  () => {
    void loadProduct()
  },
  { immediate: true },
)

const updateProduct = async () => {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await admin.authorizedRequest(`/admin/products/${route.params.id}`, {
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
    })

    if (primaryVariantId.value) {
      await admin.authorizedRequest(`/admin/variants/${primaryVariantId.value}`, {
        method: 'PATCH',
        body: {
          sku: form.sku || undefined,
          barcode: form.barcode || undefined,
          price: form.price,
        },
      })

      if (auth.canManageInventory) {
        await admin.authorizedRequest(`/admin/inventory/variants/${primaryVariantId.value}/stock`, {
          method: 'POST',
          body: { onHand: form.stock },
        })
      }
    }

    successMessage.value = auth.canManageInventory
      ? 'Cambios guardados.'
      : 'Producto actualizado. El stock no se modifico por permisos.'

    await loadProduct()
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudieron guardar los cambios.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageHeader
    title="Editar producto"
    description="Actualiza datos comerciales, variante principal y visibilidad del articulo."
  />

  <div v-if="errorMessage" class="status-message status-message--error fade-in">
    {{ errorMessage }}
  </div>

  <div v-if="loadingData" class="panel fade-in">
    <p class="muted">Cargando producto...</p>
  </div>

  <template v-else-if="product">
    <div v-if="successMessage" class="status-message status-message--success fade-in">{{ successMessage }}</div>

    <ProductForm
      :form="form"
      :categories="categoryOptions"
      :product-types="productTypes"
      :loading="saving"
      :error-message="errorMessage"
      :disable-stock="!auth.canManageInventory"
      :stock-hint="stockHint"
      submit-label="Guardar cambios"
      loading-label="Guardando..."
      @submit="updateProduct"
    >
      <template #actions>
        <RouterLink class="btn btn-ghost" :to="{ name: 'products' }">Volver</RouterLink>
      </template>
    </ProductForm>
  </template>

  <section v-else class="panel fade-in">
    <div class="empty-state">No fue posible abrir este producto.</div>
  </section>
</template>
