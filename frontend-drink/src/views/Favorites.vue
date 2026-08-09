<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import ProductCatalogGrid from '../components/storefront/ProductCatalogGrid.vue'
import { useStorefrontCartStore } from '../stores/storefrontCart'
import { useStorefrontFavoritesStore } from '../stores/storefrontFavorites'
import { useStorefrontProductsStore } from '../stores/storefrontProducts'
import { useStorefrontUiStore } from '../stores/storefrontUi'

const cartStore = useStorefrontCartStore()
const favoritesStore = useStorefrontFavoritesStore()
const productsStore = useStorefrontProductsStore()
const uiStore = useStorefrontUiStore()

const { loading: cartLoading, cartItems } = storeToRefs(cartStore)
const { favoriteCount } = storeToRefs(favoritesStore)
const { catalogProducts, loadingProducts, productsError } = storeToRefs(productsStore)

const favoriteProducts = computed(() =>
  catalogProducts.value.filter((product) => favoritesStore.isFavorite(product)),
)

const addedVariantIds = computed(() =>
  cartItems.value.map((item) => item.variantId).filter(Boolean),
)

onMounted(() => {
  if (favoriteCount.value) {
    void productsStore.loadProducts()
  }
})

async function handleAddToCart({ product, quantity }) {
  const nextCart = await cartStore.addProductToCart(product, quantity)

  if (nextCart?.id) {
    uiStore.showToast(`${quantity} x ${product.title} fue agregado a la canasta`)
    uiStore.openCart()
  }
}
</script>

<template>
  <section class="favorites-view">
    <div class="favorites-header">
      <p class="eyebrow">Favoritos</p>
      <h1>Tu lista guardada</h1>
    </div>

    <ProductCatalogGrid
      :products="favoriteProducts"
      :loading="loadingProducts && favoriteCount > 0"
      :error="productsError"
      :cart-loading="cartLoading"
      :added-variant-ids="addedVariantIds"
      empty-message="No tienes productos favoritos guardados."
      @add-to-cart="handleAddToCart"
    />
  </section>
</template>

<style scoped>
.favorites-view {
  display: grid;
  gap: 28px;
  margin: 20px;
}

.favorites-header {
  display: grid;
  gap: 12px;
}

.eyebrow {
  margin: 0;
  color: var(--text-brand);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.favorites-header h1 {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: clamp(34px, 4vw, 46px);
  letter-spacing: -0.04em;
}
</style>
