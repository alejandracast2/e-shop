<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import StoreHero from '../components/storefront/StoreHero.vue'
import CategoryCircles from '../components/storefront/CategoryCircles.vue'
import ProductCatalog from '../components/storefront/ProductCatalog.vue'
import StoreFeature from '../components/storefront/StoreFeature.vue'
import StoreFooter from '../components/storefront/StoreFooter.vue'
import { useStorefrontCartStore } from '../stores/storefrontCart'
import { useStorefrontCategoriesStore } from '../stores/storefrontCategories'
import { useStorefrontProductsStore } from '../stores/storefrontProducts'

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

    <main class="page-content">
        <StoreHero :featured-product="featuredProduct" :category-count="rootCategories.length"
            :product-count="sortedProducts.length" @explore="scrollToCatalog" @open-cart="cartOpen = true" />

        <CategoryCircles :categories="rootCategories" :active-category-id="activeRootCategoryId"
            @select-category="selectCategory" />

        <ProductCatalog :products="sortedProducts" :active-category-name="activeCategoryName" :sort-key="sortKey"
            :loading="loadingProducts" :error="productsError" :cart-loading="cartLoading"
            @update:sort-key="sortKey = $event" @add-to-cart="addProductToCart" />

        <StoreFeature :featured-product="featuredProduct" />
        <StoreFooter />
    </main>
</template>
<style>
.page-content {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  display: grid;
  gap: 34px;
  padding: 0 0 50px;
}

@media (max-width: 720px) {

  .page-content {
    width: min(1240px, calc(100% - 20px));
    gap: 24px;
  }
}
</style>