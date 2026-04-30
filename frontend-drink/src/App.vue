<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import AgeVerification from './components/AgeVerification.vue'
import CategoryNav from './components/CategoryNav.vue'
import CartDrawer from './components/storefront/CartDrawer.vue'
import { useStorefrontCartStore } from './stores/storefrontCart'
import { useStorefrontCategoriesStore } from './stores/storefrontCategories'
import { useStorefrontProductsStore } from './stores/storefrontProducts'

const CART_STORAGE_KEY = 'frontend-drink-cart-id'
const SHIPPING_THRESHOLD = 180000
const SHIPPING_PRICE = 11000

const categoriesStore = useStorefrontCategoriesStore()
const productsStore = useStorefrontProductsStore()
const cartStore = useStorefrontCartStore()

const { categories, loading: categoriesLoading, error: categoriesError } = storeToRefs(categoriesStore)
const { products, loadingProducts, productsError } = storeToRefs(productsStore)
const { cart, loading: cartLoading, error: cartError } = storeToRefs(cartStore)

const { loadCategories } = categoriesStore
const { loadProducts } = productsStore
const { createCart, loadCart, upsertItems, updateItem } = cartStore

const searchQuery = ref('')
const debouncedSearch = ref('')
const activeCategoryId = ref('')
const sortKey = ref('featured')
const cartOpen = ref(false)
const persistedCartId = ref('')
const toast = reactive({
  visible: false,
  message: '',
})

let searchTimerId = 0
let toastTimerId = 0

const flattenedCategories = computed(() => flattenCategoryTree(categories.value))

const rootCategories = computed(() => {
  console.log("categorias", categories.value)

  return categories.value.map((category) => ({
    ...category,
    childrenCount: Array.isArray(category.children) ? category.children.length : 0,
  }))
})

const activeRootCategoryId = computed(() => {
  if (!activeCategoryId.value) return ''
  return findRootCategoryId(categories.value, activeCategoryId.value)
})

const activeCategoryName = computed(() => {
  if (!activeCategoryId.value) return 'Toda la bodega'
  return flattenedCategories.value.find((category) => category.id === activeCategoryId.value)?.name
    || 'Toda la bodega'
})

const catalogProducts = computed(() =>
  products.value.map((product) => normalizeProduct(product)),
)

const sortedProducts = computed(() => {
  const list = [...catalogProducts.value]

  if (sortKey.value === 'price-asc') {
    list.sort((left, right) => left.price - right.price)
  } else if (sortKey.value === 'price-desc') {
    list.sort((left, right) => right.price - left.price)
  } else if (sortKey.value === 'title') {
    list.sort((left, right) => left.title.localeCompare(right.title, 'es'))
  }

  return list
})

const featuredProduct = computed(() => sortedProducts.value[0] ?? null)

const cartItems = computed(() => {
  const items = Array.isArray(cart.value?.items) ? cart.value.items : []

  return items
    .filter((item) => Number(item.quantity || 0) > 0)
    .map((item) => ({
      id: item.id,
      variantId: item.variantId,
      title:
        item.titleSnapshot
        || item.variant?.product?.title
        || 'Producto en carrito',
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
    }))
})

const cartCount = computed(() =>
  cartItems.value.reduce((total, item) => total + item.quantity, 0),
)

const subtotal = computed(() =>
  cartItems.value.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
)

const shipping = computed(() => {
  if (!subtotal.value) return 0
  return subtotal.value >= SHIPPING_THRESHOLD ? 0 : SHIPPING_PRICE
})

const total = computed(() => subtotal.value + shipping.value)

watch(searchQuery, (nextValue) => {
  if (typeof window === 'undefined') {
    debouncedSearch.value = nextValue.trim()
    return
  }

  window.clearTimeout(searchTimerId)
  searchTimerId = window.setTimeout(() => {
    debouncedSearch.value = nextValue.trim()
  }, 280)
})

watch([activeCategoryId, debouncedSearch], ([categoryId, search]) => {
  void loadProducts({
    categoryId: categoryId || undefined,
    search: search || undefined,
  })
}, { immediate: true })

watch(
  () => cart.value?.id,
  (nextCartId) => {
    if (!nextCartId || typeof window === 'undefined') return
    persistedCartId.value = nextCartId
    window.localStorage.setItem(CART_STORAGE_KEY, nextCartId)
  },
)

onMounted(() => {
  void loadCategories()

  if (typeof window === 'undefined') {
    return
  }
  persistedCartId.value = window.localStorage.getItem(CART_STORAGE_KEY) || ''

  if (persistedCartId.value) {
    void restoreCart(persistedCartId.value)
  }
})

function flattenCategoryTree(nodes, accumulator = []) {
  nodes.forEach((node) => {
    accumulator.push(node)
    if (Array.isArray(node.children) && node.children.length) {
      flattenCategoryTree(node.children, accumulator)
    }
  })
  return accumulator
}

function findRootCategoryId(nodes, targetId) {
  for (const node of nodes) {
    if (node.id === targetId) return node.id
    if (Array.isArray(node.children) && node.children.length) {
      const childMatch = findRootCategoryId(node.children, targetId)
      if (childMatch) return node.id
    }
  }

  return ''
}

function normalizeProduct(product) {
  const primaryVariant = getPrimaryVariant(product)
  const imageUrl = product.images?.[0]?.file?.url || product.category?.imageUrl || ''
  const price = Number(primaryVariant?.price || 0)
  const compareAtPrice = Number(primaryVariant?.compareAtPrice || 0) || null
  const stock = Number(primaryVariant?.availableStock || 0)

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description:
      product.description?.trim()
      || 'Disponible en la coleccion activa del storefront.',
    categoryId: product.category?.id || '',
    categoryName: product.category?.name || 'Catalogo general',
    imageUrl,
    price,
    compareAtPrice,
    stockLabel: primaryVariant
      ? stock > 0
        ? `${stock} disponibles`
        : 'Stock por confirmar'
      : '',
    variantId: primaryVariant?.id || '',
    initials: buildInitials(product.title),
  }
}

function getPrimaryVariant(product) {
  if (!Array.isArray(product?.variants) || !product.variants.length) {
    return null
  }

  return product.variants.find((variant) => variant.isActive !== false) || product.variants[0]
}

function buildInitials(value) {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0])
    .join('')
    .toUpperCase()
}

async function restoreCart(cartId) {
  const restoredCart = await loadCart(cartId)

  if (!restoredCart?.id && typeof window !== 'undefined') {
    persistedCartId.value = ''
    window.localStorage.removeItem(CART_STORAGE_KEY)
  }
}

function selectCategory(categoryId) {
  activeCategoryId.value = categoryId
}



function scrollToCatalog() {
  if (typeof document === 'undefined') return
  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function addProductToCart(product) {
  if (!product.variantId) return

  const existingItem = cartItems.value.find((item) => item.variantId === product.variantId)
  const nextQuantity = existingItem ? existingItem.quantity + 1 : 1

  let nextCart = null

  if (cart.value?.id || persistedCartId.value) {
    nextCart = await upsertItems({
      cartId: cart.value?.id || persistedCartId.value,
      items: [
        {
          variantId: product.variantId,
          quantity: nextQuantity,
        },
      ],
    })
  } else {
    nextCart = await createCart({
      currency: 'COP',
      items: [
        {
          variantId: product.variantId,
          quantity: nextQuantity,
        },
      ],
    })
  }

  if (nextCart?.id) {
    showToast(`${product.title} fue agregado a la canasta`)
    cartOpen.value = true
  }
}

async function changeCartQuantity(item, quantity) {
  if (!item?.id || quantity < 1) return
  await updateItem(item.id, { quantity })
}

function showToast(message) {
  toast.message = message
  toast.visible = true

  if (typeof window === 'undefined') return

  window.clearTimeout(toastTimerId)
  toastTimerId = window.setTimeout(() => {
    toast.visible = false
  }, 2200)
}
</script>

<template>
  <div class="page-shell">
    <AgeVerification />

    <!-- Announce -->
    <div class="announce">
      <span>Envíos gratis desde <strong>$180.000</strong></span>
    </div>

    <CategoryNav :categories="rootCategories" :active-category-id="activeRootCategoryId" :search-query="searchQuery"
      :cart-count="cartCount" :loading="categoriesLoading" :error="categoriesError" @select-category="selectCategory"
      @update:search-query="searchQuery = $event" @open-cart="cartOpen = true" />
      <RouterView />

    <CartDrawer :open="cartOpen" :items="cartItems" :subtotal="subtotal" :shipping="shipping" :total="total"
      :loading="cartLoading" :error="cartError" @close="cartOpen = false" @update-quantity="changeCartQuantity" />

    <div class="toast" :class="{ visible: toast.visible }">
      {{ toast.message }}
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');


:global(body) {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(143, 34, 48, 0.08), transparent 22%),
    linear-gradient(180deg, #faf7f2, #f4ede3 42%, #fbf9f6);
  color: #12100f;
  font-family: 'Manrope', 'Segoe UI', sans-serif;
}

:global(*) {
  box-sizing: border-box;
}

.page-shell {
  min-height: 100vh;
}

/* ---------- Announcement bar ---------- */
.announce {
  background: var(--ink);
  color: var(--bone);
  font-size: 12px;
  letter-spacing: .14em;
  text-transform: uppercase;
  padding: 9px 0;
  text-align: center;
}

.announce span {
  opacity: .7;
  margin: 0 18px
}

.announce strong {
  color: #e6b7bd;
  font-weight: 500;
  letter-spacing: .18em
}




.age-card {
  width: min(520px, 100%);
  padding: 34px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(143, 34, 48, 0.16), transparent 28%),
    #faf7f2;
  box-shadow: 0 32px 80px -50px rgba(0, 0, 0, 0.6);
}

.eyebrow {
  margin: 0 0 12px;
  color: #7b1f2c;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.age-card h1 {
  margin: 0;
  color: #12100f;
  font-family: 'Georgia', serif;
  font-size: 48px;
  letter-spacing: -0.06em;
}

.age-card p:last-of-type {
  margin: 18px 0 0;
  color: #453d38;
  line-height: 1.75;
}

.age-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.primary-button,
.ghost-button {
  padding: 14px 20px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  text-decoration: none;
}

.primary-button {
  border: 0;
  background: #6b1520;
  color: #faf7f2;
}

.ghost-button {
  border: 1px solid rgba(18, 16, 15, 0.12);
  color: #12100f;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 75;
  padding: 14px 18px;
  border-radius: 999px;
  background: #12100f;
  color: #faf7f2;
  box-shadow: 0 20px 44px -30px rgba(0, 0, 0, 0.6);
  transform: translate(-50%, 16px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast.visible {
  opacity: 1;
  transform: translate(-50%, 0);
}

@media (max-width: 720px) {


  .age-card {
    padding: 28px 22px;
  }

  .age-card h1 {
    font-size: 40px;
  }
}
</style>
