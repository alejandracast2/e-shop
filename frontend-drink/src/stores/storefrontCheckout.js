import { ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'

export const useStorefrontCheckoutStore = defineStore('storefrontCheckout', () => {
  const checkoutResult = ref(null)
  const loading = ref(false)
  const error = ref('')

  async function confirmCheckout(payload) {
    loading.value = true
    error.value = ''

    try {
      const data = await storefrontRequest('/storefront/checkout/confirm', {
        method: 'POST',
        body: payload,
      })

      checkoutResult.value = data ?? null
      return checkoutResult.value
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'No se pudo confirmar el checkout.'
      error.value = message
      checkoutResult.value = null
      return checkoutResult.value
    } finally {
      loading.value = false
    }
  }

  function resetCheckout() {
    checkoutResult.value = null
    error.value = ''
  }

  return {
    checkoutResult,
    loading,
    error,
    confirmCheckout,
    resetCheckout,
  }
})
