import { ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'

export const useStorefrontOrdersStore = defineStore('storefrontOrders', () => {
  const order = ref(null)
  const loading = ref(false)
  const error = ref('')
  const lastLookup = ref({
    orderNumber: '',
    email: '',
  })

  async function loadOrder(orderNumber, options = {}) {
    if (!orderNumber) {
      error.value = 'Order number is required.'
      order.value = null
      return null
    }

    loading.value = true
    error.value = ''
    lastLookup.value = {
      orderNumber: String(orderNumber),
      email: options.email ?? '',
    }

    try {
      const data = await storefrontRequest(`/storefront/orders/${orderNumber}`, {
        query: {
          email: options.email || undefined,
        },
      })

      order.value = data ?? null
      return order.value
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'No se pudo consultar la orden.'
      error.value = message
      order.value = null
      return order.value
    } finally {
      loading.value = false
    }
  }

  function resetOrder() {
    order.value = null
    error.value = ''
    lastLookup.value = {
      orderNumber: '',
      email: '',
    }
  }

  return {
    order,
    loading,
    error,
    lastLookup,
    loadOrder,
    resetOrder,
  }
})
