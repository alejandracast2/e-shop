<script setup>
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'

import ProductCatalogGrid from '../components/storefront/ProductCatalogGrid.vue'
import { useStorefrontCartStore } from '../stores/storefrontCart'
import { useStorefrontCatalogStore } from '../stores/storefrontCatalog'
import { useStorefrontCategoriesStore } from '../stores/storefrontCategories'
import { useStorefrontProductsStore } from '../stores/storefrontProducts'
import { useStorefrontUiStore } from '../stores/storefrontUi'

const cartStore = useStorefrontCartStore()
const catalogStore = useStorefrontCatalogStore()
const categoriesStore = useStorefrontCategoriesStore()
const productsStore = useStorefrontProductsStore()
const uiStore = useStorefrontUiStore()

const { loading: cartLoading, cartItems } = storeToRefs(cartStore)
const { activeCategoryId, debouncedSearch, sortKey } = storeToRefs(catalogStore)
const { catalogProducts, loadingProducts, productsError } = storeToRefs(productsStore)

const sortOptions = [
  { id: 'featured', label: 'Destacados' },
  { id: 'price-asc', label: 'Precio menor' },
  { id: 'price-desc', label: 'Precio mayor' },
  { id: 'title', label: 'Nombre' },
]

const activeCategoryName = computed(() =>
  categoriesStore.getCategoryName(activeCategoryId.value),
)

const sortedProducts = computed(() => {
  const list = [...catalogProducts.value]

  if (sortKey.value === 'price-asc') {
    list.sort((left, right) => left.price - right.price)
  } else if (sortKey.value === 'price-desc') {
    list.sort((left, right) => right.price - left.price)
  } else if (sortKey.value === 'title') {
    list.sort((left, right) => left.title.localeCompare(right.title, 'es'))
  }

  return list
})

const addedVariantIds = computed(() =>
  cartItems.value.map((item) => item.variantId).filter(Boolean),
)

watch([activeCategoryId, debouncedSearch], ([categoryId, search]) => {
  void productsStore.loadProducts({
    categoryId: categoryId || undefined,
    search: search || undefined,
  })
}, { immediate: true })

onMounted(() => {
  void categoriesStore.loadCategories()
})

function handleSortChange(event) {
  catalogStore.setSortKey(event.target.value)
}

async function handleAddToCart({ product, quantity }) {
  console.log('Adding product to cart:', product, 'Quantity:', quantity)
  const nextCart = await cartStore.addProductToCart(product, quantity)

  if (nextCart?.id) {
    uiStore.showToast(`${quantity} x ${product.title} fue agregado a la canasta`)
    uiStore.openCart()
  }
}
</script>

<template>
  <section class="catalog" id="catalogo">
    <div class="catalog-header">
      <div>
        <p class="eyebrow">Catalogo conectado</p>
        <h2>{{ activeCategoryName }}</h2>
      </div>

      <label class="sort-control">
        <span>Ordenar por</span>
        <select
          :value="sortKey"
          @change="handleSortChange"
        >
          <option v-for="option in sortOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <ProductCatalogGrid
      :products="sortedProducts"
      :loading="loadingProducts"
      :error="productsError"
      :cart-loading="cartLoading"
      :added-variant-ids="addedVariantIds"
      @add-to-cart="handleAddToCart"
    />
  </section>
</template>

<style scoped>
.catalog {
  display: grid;
  gap: 28px;
  margin : 10px 20px 0;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: end;
}

.eyebrow {
  margin: 0 0 12px;
  color: #7b1f2c;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.catalog-header h2 {
  margin: 0;
  color: #12100f;
  font-family: 'Georgia', serif;
  font-size: clamp(34px, 4vw, 46px);
  letter-spacing: -0.04em;
}

.sort-control {
  display: grid;
  gap: 8px;
  color: #5a514c;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.sort-control select {
  min-width: 180px;
  border: 1px solid rgba(18, 16, 15, 0.1);
  border-radius: 16px;
  background: #ffffff;
  color: #12100f;
  padding: 12px 14px;
  font: inherit;
  letter-spacing: normal;
  text-transform: none;
}

@media (max-width: 760px) {
  .catalog-header {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-control select {
    min-width: 100%;
  }
}
</style>
