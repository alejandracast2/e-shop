import { ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'

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
