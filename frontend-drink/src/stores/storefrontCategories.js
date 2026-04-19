import { ref } from 'vue'
import { defineStore } from 'pinia'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const STORE_SLUG = import.meta.env.VITE_STORE_SLUG
const STORE_ID = import.meta.env.VITE_STORE_ID

export const useStorefrontCategoriesStore = defineStore('storefrontCategories', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref('')

  let pendingRequest = null

  function buildHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(STORE_SLUG ? { 'x-store-slug': STORE_SLUG } : {}),
      ...(STORE_ID ? { 'x-store-id': STORE_ID } : {}),
    }
  }

  async function loadCategories() {
    if (pendingRequest) {
      return pendingRequest
    }

    loading.value = true
    error.value = ''

    pendingRequest = (async () => {
      try {
        const response = await fetch(`${API_URL}/storefront/categories`, {
          headers: buildHeaders(),
        })

        if (!response.ok) {
          let message = `Request failed (${response.status})`

          try {
            const data = await response.json()
            message = data.message || message
          } catch {
            // ignore parse errors
          }

          throw new Error(message)
        }

        const data = await response.json()
        categories.value = Array.isArray(data) ? data : []
        return categories.value
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudieron cargar las categorias.'
        error.value = message
        categories.value = []
        return categories.value
      } finally {
        loading.value = false
        pendingRequest = null
      }
    })()

    return pendingRequest
  }

  return {
    categories,
    loading,
    error,
    loadCategories,
  }
})
