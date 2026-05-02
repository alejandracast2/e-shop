<script setup>
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useStorefrontCartStore } from '../../stores/storefrontCart'
import { useStorefrontCatalogStore } from '../../stores/storefrontCatalog'
import { useStorefrontCategoriesStore } from '../../stores/storefrontCategories'
import { useStorefrontProductsStore } from '../../stores/storefrontProducts'
import { useStorefrontUiStore } from '../../stores/storefrontUi'

const cartStore = useStorefrontCartStore()
const catalogStore = useStorefrontCatalogStore()
const categoriesStore = useStorefrontCategoriesStore()
const productsStore = useStorefrontProductsStore()
const uiStore = useStorefrontUiStore()

const { loading: cartLoading } = storeToRefs(cartStore)
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

watch([activeCategoryId, debouncedSearch], ([categoryId, search]) => {
  void productsStore.loadProducts({
    categoryId: categoryId || undefined,
    search: search || undefined,
  })
}, { immediate: true })

onMounted(() => {
  void categoriesStore.loadCategories()
})

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function handleSortChange(event) {
  catalogStore.setSortKey(event.target.value)
}

async function handleAddToCart(product) {
  const nextCart = await cartStore.addProductToCart(product)

  if (nextCart?.id) {
    uiStore.showToast(`${product.title} fue agregado a la canasta`)
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
        <select :value="sortKey" @change="handleSortChange">
          <option v-for="option in sortOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="loadingProducts" class="catalog-status">Cargando productos...</div>
    <div v-else-if="productsError" class="catalog-status catalog-status--error">{{ productsError }}</div>
    <div v-else-if="!sortedProducts.length" class="catalog-status">
      No hay productos activos para los filtros actuales.
    </div>

    <div v-else class="catalog-grid">
      <article v-for="product in sortedProducts" :key="product.id" class="product-card">
        <div class="tags">
          <div style="display: flex;flex-direction: column;gap: 4px;" v-if="product.tags.length">
            <span v-for="tag in product.tags" :key="tag" class="ptag" :class="{
              'sale': tag === product.discountTag,
              'new': tag.toLowerCase() === 'nuevo',
            }">{{ tag }}</span>
          </div>
          <span class="ptag added">En canasta</span>
        </div>
        <button class="fav">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <!-- <div class="pimg">

        </div> -->
        <div class="product-visual">
          <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.title" />
          <div v-else class="visual-fallback">
            <span>{{ product.initials }}</span>
          </div>
          <!-- <span v-if="product.stockLabel" class="stock-badge">{{ product.stockLabel }}</span> -->
        </div>

        <div class="product-body">
          <div class="product-copy">
            <p class="product-category">{{ product.categoryName }}</p>
            <h3>{{ product.title }}</h3>
            <p>{{ product.description }}</p>
          </div>

          <div class="product-meta">
            <div class="price-row">
              <strong>{{ formatCurrency(product.price) }}</strong>
              <span v-if="product.discountPercent">
                {{ formatCurrency(product.basePrice) }}
              </span>
            </div>

            <button class="add-button" type="button" :disabled="!product.variantId || cartLoading"
              @click="handleAddToCart(product)">
              {{ product.variantId ? (cartLoading ? 'Actualizando...' : 'Agregar') : 'Sin variante' }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.fav {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--ink-4);
  z-index: 2;
  transition: .15s all;
}

.fav:hover {
  color: var(--wine)
}

.fav.on {
  color: var(--wine)
}

.fav svg {
  width: 18px;
  height: 18px;
  stroke-width: 1.5
}

.tags {
  position: absolute;
  top: 14px;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
}

.ptag {
  font-size: 11px;
  letter-spacing: .04em;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 0 4px 4px 0;
}

.ptag.sale {
  background: var(--wine);
  color: var(--bone)
}

.ptag.new {
  background: var(--ink);
  color: var(--bone)
}

.ptag.added {
  background: var(--bone);
  color: var(--wine);
  border: 1px solid var(--wine)
}

/* lo antiguo */
.catalog {
  display: grid;
  gap: 28px;
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

.catalog-status {
  padding: 32px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(18, 16, 15, 0.08);
  color: #5a514c;
}

.catalog-status--error {
  color: #8e2f3c;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 18px;
}

.product-card {
  background: #fff;
  padding: 18px 16px 16px;
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 10px;
  border: 1px solid var(--line-2);
  box-shadow: 0 1px 2px rgba(18, 16, 15, .04);
  transition: .2s box-shadow, .2s transform;

}

.product-visual {
  position: relative;
  min-height: 260px;
  overflow: hidden;
  border-radius: 20px;
}

.product-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.visual-fallback {
  width: 100%;
  height: 100%;
  min-height: 260px;
  display: grid;
  place-items: center;
}

.visual-fallback span {
  width: 120px;
  height: 120px;
  border-radius: 34px;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, rgba(107, 21, 32, 0.18), rgba(107, 21, 32, 0.05));
  color: #6b1520;
  font-family: 'Georgia', serif;
  font-size: 38px;
  letter-spacing: -0.06em;
}

.product-tags {
  position: absolute;
  left: 14px;
  top: 14px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: calc(100% - 28px);
}

.product-tag {
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(250, 247, 242, 0.92);
  color: #12100f;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.product-tag--discount {
  background: #7b1f2c;
  color: #faf7f2;
}

.product-tag--new {
  background: #12100f;
  color: #faf7f2;
}

.stock-badge {
  position: absolute;
  left: 14px;
  bottom: 14px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(18, 16, 15, 0.9);
  color: #faf7f2;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.product-body {
  display: grid;
  gap: 18px;
}

.product-copy {
  display: grid;
  gap: 8px;
}

.product-category {
  margin: 0;
  color: #7b1f2c;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.product-copy h3 {
  margin: 0;
  color: #12100f;
  font-size: 20px;
  line-height: 1.2;
}

.product-copy p:last-child {
  margin: 0;
  color: #5a514c;
  line-height: 1.65;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
}

.price-row {
  display: grid;
  gap: 4px;
}

.price-row strong {
  color: #12100f;
  font-family: 'Georgia', serif;
  font-size: 28px;
  letter-spacing: -0.05em;
}

.price-row span {
  color: #9a8d86;
  text-decoration: line-through;
}

.add-button {
  padding: 12px 16px;
  border-radius: 999px;
  border: 0;
  background: #6b1520;
  color: #faf7f2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.add-button:disabled {
  background: #bfa7ab;
  cursor: not-allowed;
}

@media (max-width: 760px) {

  .catalog-header,
  .product-meta {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-control select {
    min-width: 100%;
  }
}
</style>
