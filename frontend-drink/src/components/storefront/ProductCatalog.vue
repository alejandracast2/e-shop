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

        <div class="pprice">
          <span class="now">{{ formatCurrency(product.price) }}</span>
          <span class="was" v-if="product.discountPercent">
            {{ formatCurrency(product.basePrice) }}
          </span>
        </div>
        <h3 class="pname">{{ product.title }}</h3>
        
        <div class="pactions">
            <div class="qty">
              <button>−</button>
              <input type="number" value="1"/>
              <button>+</button>
            </div>
            <button class="addbtn" type="button"  :disabled="!product.variantId || cartLoading"
              @click="handleAddToCart(product)">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 1C1.44772 1 1 1.44772 1 2C1 2.55228 1.44772 3 2 3H3.21922L6.78345 17.2569C5.73276 17.7236 5 18.7762 5 20C5 21.6569 6.34315 23 8 23C9.65685 23 11 21.6569 11 20C11 19.6494 10.9398 19.3128 10.8293 19H15.1707C15.0602 19.3128 15 19.6494 15 20C15 21.6569 16.3431 23 18 23C19.6569 23 21 21.6569 21 20C21 18.3431 19.6569 17 18 17H8.78078L8.28078 15H18C20.0642 15 21.3019 13.6959 21.9887 12.2559C22.6599 10.8487 22.8935 9.16692 22.975 7.94368C23.0884 6.24014 21.6803 5 20.1211 5H5.78078L5.15951 2.51493C4.93692 1.62459 4.13696 1 3.21922 1H2ZM18 13H7.78078L6.28078 7H20.1211C20.6742 7 21.0063 7.40675 20.9794 7.81078C20.9034 8.9522 20.6906 10.3318 20.1836 11.3949C19.6922 12.4251 19.0201 13 18 13ZM18 20.9938C17.4511 20.9938 17.0062 20.5489 17.0062 20C17.0062 19.4511 17.4511 19.0062 18 19.0062C18.5489 19.0062 18.9938 19.4511 18.9938 20C18.9938 20.5489 18.5489 20.9938 18 20.9938ZM7.00617 20C7.00617 20.5489 7.45112 20.9938 8 20.9938C8.54888 20.9938 8.99383 20.5489 8.99383 20C8.99383 19.4511 8.54888 19.0062 8 19.0062C7.45112 19.0062 7.00617 19.4511 7.00617 20Z" fill="currentColor"></path> </g></svg>
              {{ product.variantId ? (cartLoading ? 'Actualizando...' : 'Agregar') : 'Sin variante' }}
            </button>
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

.pprice {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.pprice .now {
  font-family: 'Inter', sans-serif;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -.01em;
  color: var(--ink);
}

.pprice .was {
  font-size: 13px;
  color: var(--ink-4);
  text-decoration: line-through;
  font-weight: 400;
}
 .pname{
    font-family:'Inter', sans-serif;
    font-size:14px;line-height:1.3;font-weight:400;
    margin:0 0 12px;letter-spacing:0;color:var(--ink-2);
    min-height:38px;
  }

.pactions{
    display:flex;flex-direction:column;gap:8px;margin-top:auto;
  }
  .qty{
    display:flex;align-items:center;justify-content:space-between;
    border:1px solid var(--line);border-radius:999px;
    padding:3px;
  }
  .qty button{
    width:26px;height:26px;border-radius:50%;
    display:grid;place-items:center;
    color:var(--ink-3);font-size:14px;
    background:var(--bone-4);
  }
  .qty button:last-of-type{background:var(--ink);color:var(--bone)}
  .qty button:hover{filter:brightness(1.1)}
  .qty input{
    flex:1;text-align:center;border:0;background:transparent;
    font-family:'Inter',sans-serif;font-size:14px;font-weight:500;
    -moz-appearance:textfield;outline:none;
  }
  .qty input::-webkit-outer-spin-button,
  .qty input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
  .addbtn{
    width:100%;padding:10px 16px;border-radius:999px;
    background:var(--wine);color:var(--bone);
    font-size:13px;letter-spacing:.01em;font-weight:500;
    display:flex;align-items:center;justify-content:center;gap:8px;
    transition:.15s background;
  }
  .addbtn:hover{background:var(--wine-2)}
  .addbtn.added{background:var(--wine-3);color:var(--bone)}
  .addbtn svg{width:15px;height:15px}

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
