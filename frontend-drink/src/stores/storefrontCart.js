import { ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'

export const useStorefrontCartStore = defineStore('storefrontCart', () => {
  const cart = ref(null)
  const loading = ref(false)
  const error = ref('')
  const lastAction = ref('')

  async function runCartAction(actionName, requestFactory) {
    loading.value = true
    error.value = ''
    lastAction.value = actionName

    try {
      const data = await requestFactory()
      cart.value = data ?? null
      return cart.value
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'No se pudo completar la operacion del carrito.'
      error.value = message
      return cart.value
    } finally {
      loading.value = false
    }
  }

  function createCart(payload = {}) {
    return runCartAction('createCart', () =>
      storefrontRequest('/storefront/cart', {
        method: 'POST',
        body: payload,
      }),
    )
  }

  function loadCart(cartId) {
    if (!cartId) {
      error.value = 'Cart id is required.'
      return Promise.resolve(null)
    }

    return runCartAction('loadCart', () => storefrontRequest(`/storefront/cart/${cartId}`))
  }

  function upsertItems(payload) {
    return runCartAction('upsertItems', () =>
      storefrontRequest('/storefront/cart/items', {
        method: 'POST',
        body: payload,
      }),
    )
  }

  function updateItem(itemId, payload) {
    if (!itemId) {
      error.value = 'Cart item id is required.'
      return Promise.resolve(cart.value)
    }

    return runCartAction('updateItem', () =>
      storefrontRequest(`/storefront/cart/items/${itemId}`, {
        method: 'PATCH',
        body: payload,
      }),
    )
  }

  function resetCart() {
    cart.value = null
    error.value = ''
    lastAction.value = ''
  }

  return {
    cart,
    loading,
    error,
    lastAction,
    createCart,
    loadCart,
    upsertItems,
    updateItem,
    resetCart,
  }
})
