import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useStorefrontCatalogStore = defineStore('storefrontCatalog', () => {
  const searchQuery = ref('')
  const debouncedSearch = ref('')
  const activeCategoryId = ref('')
  const sortKey = ref('featured')

  let searchTimerId = 0

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

  function setSearchQuery(value) {
    searchQuery.value = value
  }

  function selectCategory(categoryId) {
    activeCategoryId.value = categoryId
  }

  function setSortKey(value) {
    sortKey.value = value
  }

  return {
    searchQuery,
    debouncedSearch,
    activeCategoryId,
    sortKey,
    setSearchQuery,
    selectCategory,
    setSortKey,
  }
})
