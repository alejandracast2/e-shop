import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const FAVORITES_STORAGE_KEY = 'frontend-drink-favorite-product-ids'

function normalizeFavoriteId(productOrId) {
  if (productOrId == null) return ''

  if (typeof productOrId === 'object') {
    return String(productOrId.variantId || productOrId.id || '')
  }

  return String(productOrId)
}

function getFavoriteCandidateIds(productOrId) {
  if (productOrId == null) return []

  if (typeof productOrId !== 'object') {
    const id = normalizeFavoriteId(productOrId)
    return id ? [id] : []
  }

  return [productOrId.variantId, productOrId.id]
    .map((id) => String(id || ''))
    .filter(Boolean)
    .filter((id, index, ids) => ids.indexOf(id) === index)
}

function readPersistedFavorites() {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]')
    return Array.isArray(parsed)
      ? [...new Set(parsed.map((id) => String(id)).filter(Boolean))]
      : []
  } catch {
    return []
  }
}

export const useStorefrontFavoritesStore = defineStore('storefrontFavorites', () => {
  const favoriteProductIds = ref(readPersistedFavorites())

  const favoriteProductIdSet = computed(() =>
    new Set(favoriteProductIds.value.map((id) => String(id))),
  )

  const favoriteCount = computed(() => favoriteProductIds.value.length)

  function persistFavorites() {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favoriteProductIds.value),
    )
  }

  function isFavorite(productOrId) {
    return getFavoriteCandidateIds(productOrId)
      .some((id) => favoriteProductIdSet.value.has(id))
  }

  function addFavorite(productOrId) {
    const id = normalizeFavoriteId(productOrId)
    if (!id || isFavorite(productOrId)) return false

    favoriteProductIds.value = [...favoriteProductIds.value, id]
    persistFavorites()
    return true
  }

  function removeFavorite(productOrId) {
    const candidateIds = getFavoriteCandidateIds(productOrId)
    if (!candidateIds.length || !isFavorite(productOrId)) return false

    favoriteProductIds.value = favoriteProductIds.value.filter(
      (favoriteId) => !candidateIds.includes(favoriteId),
    )
    persistFavorites()
    return true
  }

  function toggleFavorite(productOrId) {
    const id = normalizeFavoriteId(productOrId)
    if (!id) return false

    if (isFavorite(productOrId)) {
      removeFavorite(productOrId)
      return false
    }

    addFavorite(id)
    return true
  }

  function resetFavorites() {
    favoriteProductIds.value = []
    persistFavorites()
  }

  return {
    favoriteProductIds,
    favoriteProductIdSet,
    favoriteCount,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    resetFavorites,
  }
})
