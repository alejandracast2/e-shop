import { ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'

export const useStorefrontCategoriesStore = defineStore('storefrontCategories', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref('')
  const hasLoaded = ref(false)

  let pendingRequest = null

  async function loadCategories(options = {}) {
    const force = options.force ?? false

    if (pendingRequest) {
      return pendingRequest
    }

    if (hasLoaded.value && !force) {
      return categories.value
    }

    loading.value = true
    error.value = ''

    pendingRequest = (async () => {
      try {
        const data = await storefrontRequest('/storefront/categories')
        categories.value = Array.isArray(data) ? data : []
        hasLoaded.value = true
        return categories.value
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudieron cargar las categorias.'
        error.value = message
        categories.value = []
        hasLoaded.value = false
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
    hasLoaded,
    loadCategories,
  }
})
