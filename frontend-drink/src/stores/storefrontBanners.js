import { ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'

function normalizeBanner(banner) {
  if (!banner || typeof banner !== 'object') return null
  if (!banner.id || !banner.title || !banner.imageUrl) return null

  return {
    id: String(banner.id),
    title: String(banner.title),
    subtitle: typeof banner.subtitle === 'string' ? banner.subtitle : '',
    imageUrl: String(banner.imageUrl),
    mobileImageUrl: typeof banner.mobileImageUrl === 'string' ? banner.mobileImageUrl : '',
    ctaLabel: typeof banner.ctaLabel === 'string' ? banner.ctaLabel : '',
    ctaUrl: typeof banner.ctaUrl === 'string' ? banner.ctaUrl : '',
    altText: typeof banner.altText === 'string' ? banner.altText : '',
  }
}

export const useStorefrontBannersStore = defineStore('storefrontBanners', () => {
  const banners = ref([])
  const loading = ref(false)
  const error = ref('')
  const hasLoaded = ref(false)

  let pendingRequest = null

  async function loadBanners(options = {}) {
    const force = options.force ?? false

    if (pendingRequest) return pendingRequest
    if (hasLoaded.value && !force) return banners.value

    loading.value = true
    error.value = ''

    pendingRequest = (async () => {
      try {
        const data = await storefrontRequest('/storefront/banners')
        banners.value = Array.isArray(data)
          ? data.map(normalizeBanner).filter(Boolean)
          : []
        hasLoaded.value = true
        return banners.value
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'No se pudieron cargar los banners.'
        banners.value = []
        hasLoaded.value = false
        return banners.value
      } finally {
        loading.value = false
        pendingRequest = null
      }
    })()

    return pendingRequest
  }

  return {
    banners,
    loading,
    error,
    hasLoaded,
    loadBanners,
  }
})
