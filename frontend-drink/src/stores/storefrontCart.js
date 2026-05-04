import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'
import {
  calculateDiscountedPrice,
  normalizeTags,
  resolveDiscountPercent,
} from '../utils/productTags'

const CART_STORAGE_KEY = 'frontend-drink-cart-id'
const SHIPPING_THRESHOLD = 180000
const SHIPPING_PRICE = 11000

function normalizeCartQuantity(value) {
  const quantity = Number.parseInt(value, 10)
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1
}

export const useStorefrontCartStore = defineStore('storefrontCart', () => {
  const cart = ref(null)
  const loading = ref(false)
  const error = ref('')
  const lastAction = ref('')
  const persistedCartId = ref('')

  const cartItems = computed(() => {
    const items = Array.isArray(cart.value?.items) ? cart.value.items : []

    return items
      .filter((item) => Number(item.quantity || 0) > 0)
      .map((item) => {
        const tags = normalizeTags(item.variant?.product?.tags)
        const baseUnitPrice = Number(item.unitPrice || 0)

        return {
          id: item.id,
          variantId: item.variantId || item.variant?.id || '',
          productId: item.variant?.product?.id || '',
          title:
            item.titleSnapshot
            || item.variant?.product?.title
            || 'Producto en carrito',
          quantity: Number(item.quantity || 0),
          unitPrice: calculateDiscountedPrice(baseUnitPrice, tags),
          baseUnitPrice,
          discountPercent: resolveDiscountPercent(tags),
          tags,
        }
      })
  })

  const cartCount = computed(() =>
    cartItems.value.reduce((total, item) => total + item.quantity, 0),
  )

  const subtotal = computed(() =>
    cartItems.value.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
  )

  const shipping = computed(() => {
    if (!subtotal.value) return 0
    return subtotal.value >= SHIPPING_THRESHOLD ? 0 : SHIPPING_PRICE
  })

  const total = computed(() => subtotal.value + shipping.value)

  async function runCartAction(actionName, requestFactory) {
    loading.value = true
    error.value = ''
    lastAction.value = actionName

    try {
      const data = await requestFactory()
      cart.value = data ?? null
      persistCartId(cart.value?.id || '')
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

  async function restorePersistedCart() {
    if (typeof window === 'undefined') return null

    persistedCartId.value = window.localStorage.getItem(CART_STORAGE_KEY) || ''
    if (!persistedCartId.value) return null

    const restoredCart = await loadCart(persistedCartId.value)

    if (!restoredCart?.id) {
      persistCartId('')
    }

    return restoredCart
  }

  async function addProductToCart(product, quantity = 1) {
    console.log('Adding product to cart:', product, 'Quantity:', quantity)
    if (!product?.variantId) return null

    const selectedQuantity = normalizeCartQuantity(quantity)
    const existingItem = cartItems.value.find(
      (item) => String(item.variantId) === String(product.variantId),
    )
    const nextQuantity = existingItem
      ? existingItem.quantity + selectedQuantity
      : selectedQuantity

    if (cart.value?.id || persistedCartId.value) {
      return upsertItems({
        cartId: cart.value?.id || persistedCartId.value,
        items: [
          {
            variantId: product.variantId,
            quantity: nextQuantity,
          },
        ],
      })
    }

    return createCart({
      currency: 'COP',
      items: [
        {
          variantId: product.variantId,
          quantity: nextQuantity,
        },
      ],
    })
  }

  function changeCartQuantity(item, quantity) {
    if (!item?.id || quantity < 1) return Promise.resolve(cart.value)
    return updateItem(item.id, { quantity })
  }

  function persistCartId(cartId) {
    persistedCartId.value = cartId

    if (typeof window === 'undefined') return

    if (cartId) {
      window.localStorage.setItem(CART_STORAGE_KEY, cartId)
    } else {
      window.localStorage.removeItem(CART_STORAGE_KEY)
    }
  }

  function resetCart() {
    cart.value = null
    error.value = ''
    lastAction.value = ''
    persistCartId('')
  }

  return {
    cart,
    cartItems,
    cartCount,
    subtotal,
    shipping,
    total,
    loading,
    error,
    lastAction,
    persistedCartId,
    createCart,
    loadCart,
    upsertItems,
    updateItem,
    restorePersistedCart,
    addProductToCart,
    changeCartQuantity,
    resetCart,
  }
})
