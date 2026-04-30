import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'

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

export const useStorefrontCategoriesStore = defineStore('storefrontCategories', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref('')
  const hasLoaded = ref(false)

  let pendingRequest = null

  const flattenedCategories = computed(() => flattenCategoryTree(categories.value))

  const rootCategories = computed(() =>
    categories.value.map((category) => ({
      ...category,
      childrenCount: Array.isArray(category.children) ? category.children.length : 0,
    })),
  )

  function getRootCategoryId(categoryId) {
    if (!categoryId) return ''
    return findRootCategoryId(categories.value, categoryId)
  }

  function getCategoryName(categoryId) {
    if (!categoryId) return 'Toda la bodega'
    return flattenedCategories.value.find((category) => category.id === categoryId)?.name
      || 'Toda la bodega'
  }

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
    flattenedCategories,
    rootCategories,
    loading,
    error,
    hasLoaded,
    getRootCategoryId,
    getCategoryName,
    loadCategories,
  }
})
