import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'
import {
  calculateDiscountedPrice,
  normalizeTags,
  resolveDiscountPercent,
} from '../utils/productTags'

const CART_STORAGE_KEY = 'frontend-drink-cart-id'
const CART_IMAGE_STORAGE_KEY = 'frontend-drink-cart-images'
const SHIPPING_THRESHOLD = 180000
const SHIPPING_PRICE = 11000

function normalizeCartQuantity(value) {
  const quantity = Number.parseInt(value, 10)
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1
}

function resolveCartActionError(requestError) {
  return requestError instanceof Error
    ? requestError.message
    : 'No se pudo completar la operacion del carrito.'
}

function getImageUrlFromImages(images) {
  if (!Array.isArray(images) || !images.length) return ''

  const sortedImages = [...images].sort((left, right) => {
    if (left?.isCover && !right?.isCover) return -1
    if (!left?.isCover && right?.isCover) return 1
    return Number(left?.sortOrder || 0) - Number(right?.sortOrder || 0)
  })

  const image = sortedImages[0]
  return image?.file?.url || image?.url || ''
}

function resolveProductImageUrl(product) {
  if (!product) return ''

  return (
    product.imageUrl
    || product.variant?.imageUrl
    || product.variant?.product?.imageUrl
    || getImageUrlFromImages(product.images)
    || getImageUrlFromImages(product.variant?.product?.images)
    || product.category?.imageUrl
    || ''
  )
}

export const useStorefrontCartStore = defineStore('storefrontCart', () => {
  const cart = ref(null)
  const loading = ref(false)
  const error = ref('')
  const lastAction = ref('')
  const persistedCartId = ref('')
  const productImageCache = ref({})

  const cartItems = computed(() => {
    const items = Array.isArray(cart.value?.items) ? cart.value.items : []

    return items
      .filter((item) => Number(item.quantity || 0) > 0)
      .map((item) => {
        const tags = normalizeTags(item.variant?.product?.tags)
        const baseUnitPrice = Number(item.unitPrice || 0)
        const imageUrl = resolveCartItemImageUrl(item)

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
          imageUrl,
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
      rememberCartImages(cart.value)
      void hydrateMissingCartImages(cart.value)
      persistCartId(cart.value?.id || '')
      return cart.value
    } catch (requestError) {
      error.value = resolveCartActionError(requestError)
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

    restoreProductImageCache()
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

    rememberProductImage(product)

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

  async function removeCartItem(itemOrId) {
    const itemId = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id

    if (!itemId) {
      error.value = 'Cart item id is required.'
      return cart.value
    }

    const previousCart = cart.value
    const currentItems = cartItems.value
    const itemExists = currentItems.some((item) => String(item.id) === String(itemId))

    if (!previousCart || !itemExists) {
      return cart.value
    }

    const remainingItems = currentItems
      .filter((item) => String(item.id) !== String(itemId))
      .filter((item) => item.variantId && item.quantity > 0)

    error.value = ''
    lastAction.value = 'removeItem'

    cart.value = {
      ...previousCart,
      items: Array.isArray(previousCart.items)
        ? previousCart.items.filter((item) => String(item.id) !== String(itemId))
        : [],
    }

    if (!remainingItems.length) {
      cart.value = null
      persistCartId('')
      return cart.value
    }

    loading.value = true

    try {
      // The public API has no item DELETE endpoint, so persist the cart by recreating it
      // with the remaining variants while the UI updates optimistically.
      const data = await storefrontRequest('/storefront/cart', {
        method: 'POST',
        body: {
          customerId: previousCart.customerId ?? undefined,
          currency: previousCart.currency ?? 'COP',
          items: remainingItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        },
      })

      cart.value = data ?? null
      rememberCartImages(cart.value)
      persistCartId(cart.value?.id || '')
      return cart.value
    } catch (requestError) {
      cart.value = previousCart
      persistCartId(previousCart.id || persistedCartId.value)
      error.value = resolveCartActionError(requestError)
      return cart.value
    } finally {
      loading.value = false
    }
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

  function restoreProductImageCache() {
    if (typeof window === 'undefined') return

    try {
      const storedImages = JSON.parse(window.localStorage.getItem(CART_IMAGE_STORAGE_KEY) || '{}')
      productImageCache.value = storedImages && typeof storedImages === 'object' ? storedImages : {}
    } catch {
      productImageCache.value = {}
    }
  }

  function persistProductImageCache() {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CART_IMAGE_STORAGE_KEY, JSON.stringify(productImageCache.value))
  }

  function rememberProductImage(product) {
    restoreProductImageCache()

    const imageUrl = resolveProductImageUrl(product)
    const keys = [product?.variantId, product?.id, product?.productId].filter(Boolean)

    if (!imageUrl || !keys.length) return

    productImageCache.value = {
      ...productImageCache.value,
      ...Object.fromEntries(keys.map((key) => [String(key), imageUrl])),
    }
    persistProductImageCache()
  }

  function rememberCartImages(cartData) {
    const items = Array.isArray(cartData?.items) ? cartData.items : []
    if (!items.length) return

    const nextCache = { ...productImageCache.value }
    let hasChanges = false

    items.forEach((item) => {
      const imageUrl = resolveCartItemSourceImageUrl(item)
      const keys = [
        item.variantId,
        item.variant?.id,
        item.variant?.product?.id,
      ].filter(Boolean)

      if (!imageUrl || !keys.length) return

      keys.forEach((key) => {
        nextCache[String(key)] = imageUrl
        hasChanges = true
      })
    })

    if (!hasChanges) return

    productImageCache.value = nextCache
    persistProductImageCache()
  }

  function resolveCartItemSourceImageUrl(item) {
    return (
      resolveProductImageUrl(item?.variant?.product)
      || resolveProductImageUrl(item?.variant)
      || item?.imageUrl
      || ''
    )
  }

  function resolveCartItemImageUrl(item) {
    const imageUrl = resolveCartItemSourceImageUrl(item)

    if (imageUrl) return imageUrl

    const keys = [
      item?.variantId,
      item?.variant?.id,
      item?.variant?.product?.id,
    ].filter(Boolean)

    return keys.map((key) => productImageCache.value[String(key)]).find(Boolean) || ''
  }

  async function hydrateMissingCartImages(cartData) {
    const items = Array.isArray(cartData?.items) ? cartData.items : []
    const productsBySlug = new Map()

    items.forEach((item) => {
      if (resolveCartItemImageUrl(item)) return

      const slug = item?.variant?.product?.slug
      if (!slug) return

      const entry = productsBySlug.get(slug) || {
        slug,
        keys: new Set(),
      }
      const imageKeys = [item.variantId, item.variant?.id, item.variant?.product?.id]

      imageKeys.filter(Boolean).forEach((key) => entry.keys.add(String(key)))

      productsBySlug.set(slug, entry)
    })

    if (!productsBySlug.size) return

    await Promise.all(
      [...productsBySlug.values()].map(async ({ slug, keys }) => {
        try {
          const product = await storefrontRequest(`/storefront/products/${slug}`)
          const imageUrl = resolveProductImageUrl(product)

          if (!imageUrl) return

          productImageCache.value = {
            ...productImageCache.value,
            ...Object.fromEntries([...keys, product?.id].filter(Boolean).map((key) => [String(key), imageUrl])),
          }
        } catch {
          // Image hydration should not block the cart itself.
        }
      }),
    )

    persistProductImageCache()
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
    removeCartItem,
    resetCart,
  }
})
