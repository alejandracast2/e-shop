<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import ProductForm from '@/components/ProductForm.vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { toErrorMessage } from '@/lib/api'
import { flattenCategoryOptions, slugify } from '@/utils/catalog'
import { normalizeProductImages } from '@/utils/productImages'
import { parseProductTags } from '@/utils/productTags'

const router = useRouter()
const auth = useAuthStore()
const admin = useAdminStore()

const loadingData = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const categoriesRaw = ref([])
const productTypes = ref([])

const form = reactive({
  title: '',
  slug: '',
  brand: '',
  sku: '',
  barcode: '',
  categoryId: '',
  productTypeId: '',
  description: '',
  images: [],
  tagsText: '',
  price: 0,
  stock: 0,
  status: 'active',
})

watch(
  () => form.title,
  (value) => {
    if (!form.slug) {
      form.slug = slugify(value)
    }
  },
)

const categoryOptions = computed(() => flattenCategoryOptions(categoriesRaw.value))

const stockHint = computed(() =>
  auth.canManageInventory
    ? ''
    : 'Tu rol puede crear el producto, pero el stock solo lo puede ajustar un tenant_owner o store_admin.',
)

const loadDependencies = async () => {
  if (!auth.isAuthenticated) return

  loadingData.value = true
  errorMessage.value = ''

  try {
    const [categoryPayload, typePayload] = await Promise.all([
      admin.authorizedRequest('/admin/categories'),
      admin.authorizedRequest('/admin/product-types'),
    ])

    categoriesRaw.value = Array.isArray(categoryPayload) ? categoryPayload : []
    productTypes.value = Array.isArray(typePayload) ? typePayload : []
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudieron cargar las dependencias del formulario.')
  } finally {
    loadingData.value = false
  }
}

watch(
  () => admin.requestScopeKey,
  () => {
    void loadDependencies()
  },
  { immediate: true },
)

const createProduct = async () => {
  saving.value = true
  errorMessage.value = ''

  try {
    const payload = await admin.authorizedRequest('/admin/products', {
      method: 'POST',
      body: {
        title: form.title,
        slug: form.slug,
        brand: form.brand || undefined,
        description: form.description || undefined,
        images: normalizeProductImages(form.images),
        tags: parseProductTags(form.tagsText),
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
    })

    const variantId = payload?.variants?.[0]?.id

    if (variantId && auth.canManageInventory) {
      await admin.authorizedRequest(`/admin/inventory/variants/${variantId}/stock`, {
        method: 'POST',
        body: { onHand: form.stock },
      })
    }

    await router.push({ name: 'products' })
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudo crear el producto.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageHeader
    title="Nuevo producto"
    description="Crea un item nuevo reutilizando categorias, tipos y la misma API admin."
  />

  <div v-if="loadingData" class="panel fade-in">
    <p class="muted">Cargando opciones del formulario...</p>
  </div>

  <ProductForm
    v-else
    :form="form"
    :categories="categoryOptions"
    :product-types="productTypes"
    :loading="saving"
    :error-message="errorMessage"
    :disable-stock="!auth.canManageInventory"
    :stock-hint="stockHint"
    submit-label="Crear producto"
    loading-label="Creando..."
    @submit="createProduct"
  >
    <template #actions>
      <RouterLink class="btn btn-ghost" :to="{ name: 'products' }">Cancelar</RouterLink>
    </template>
  </ProductForm>
</template>
