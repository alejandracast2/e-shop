import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'
import {
  calculateDiscountedPrice,
  getDiscountTag,
  hasStatusTag,
  normalizeTags,
  resolveDiscountPercent,
} from '../utils/productTags'

function buildInitials(value) {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0])
    .join('')
    .toUpperCase()
}

function getPrimaryVariant(product) {
  if (!Array.isArray(product?.variants) || !product.variants.length) {
    return null
  }

  return product.variants.find((variant) => variant.isActive !== false) || product.variants[0]
}

function normalizeProduct(product) {
  const primaryVariant = getPrimaryVariant(product)
  const imageUrl = product.images?.[0]?.file?.url || product.category?.imageUrl || ''
  const basePrice = Number(primaryVariant?.price || 0)
  const tags = normalizeTags(product.tags)
  const discountPercent = resolveDiscountPercent(tags)
  const price = calculateDiscountedPrice(basePrice, tags)
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
    basePrice,
    discountPercent,
    discountTag: getDiscountTag(tags),
    isNew: hasStatusTag(tags, 'nuevo'),
    tags,
    stockLabel: primaryVariant
      ? stock > 0
        ? `${stock} disponibles`
        : 'Stock por confirmar'
      : '',
    variantId: primaryVariant?.id || '',
    initials: buildInitials(product.title),
  }
}

function normalizeProductFilters(filters = {}) {
  return {
    search: filters.search ?? '',
    categoryId: filters.categoryId ?? filters.category ?? '',
  }
}

export const useStorefrontProductsStore = defineStore('storefrontProducts', () => {
  const products = ref([])
  const product = ref(null)
  const productFilters = ref({
    search: '',
    categoryId: '',
  })
  const loadingProducts = ref(false)
  const loadingProduct = ref(false)
  const productsError = ref('')
  const productError = ref('')

  let pendingProductsRequest = null
  let pendingProductsRequestKey = ''
  const pendingProductRequests = new Map()

  const catalogProducts = computed(() =>
    products.value.map((productItem) => normalizeProduct(productItem)),
  )

  async function loadProducts(filters = {}) {
    const normalizedFilters = normalizeProductFilters(filters)
    const requestKey = JSON.stringify(normalizedFilters)

    if (pendingProductsRequest && pendingProductsRequestKey === requestKey) {
      return pendingProductsRequest
    }

    loadingProducts.value = true
    productsError.value = ''
    productFilters.value = normalizedFilters
    pendingProductsRequestKey = requestKey

    pendingProductsRequest = (async () => {
      try {
        const data = await storefrontRequest('/storefront/products', {
          query: {
            search: normalizedFilters.search || undefined,
            category: normalizedFilters.categoryId || undefined,
          },
        })

        products.value = Array.isArray(data) ? data : []
        return products.value
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudieron cargar los productos.'
        productsError.value = message
        products.value = []
        return products.value
      } finally {
        loadingProducts.value = false
        pendingProductsRequest = null
        pendingProductsRequestKey = ''
      }
    })()

    return pendingProductsRequest
  }

  async function loadProduct(slug) {
    if (!slug) {
      product.value = null
      productError.value = 'Product slug is required.'
      return null
    }

    if (pendingProductRequests.has(slug)) {
      return pendingProductRequests.get(slug)
    }

    loadingProduct.value = true
    productError.value = ''

    const request = (async () => {
      try {
        const data = await storefrontRequest(`/storefront/products/${slug}`)
        product.value = data ?? null
        return product.value
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo cargar el producto.'
        productError.value = message
        product.value = null
        return product.value
      } finally {
        loadingProduct.value = false
        pendingProductRequests.delete(slug)
      }
    })()

    pendingProductRequests.set(slug, request)
    return request
  }

  function resetProducts() {
    products.value = []
    productsError.value = ''
    productFilters.value = {
      search: '',
      categoryId: '',
    }
  }

  function resetProduct() {
    product.value = null
    productError.value = ''
  }

  return {
    products,
    product,
    catalogProducts,
    productFilters,
    loadingProducts,
    loadingProduct,
    productsError,
    productError,
    loadProducts,
    loadProduct,
    resetProducts,
    resetProduct,
  }
})
