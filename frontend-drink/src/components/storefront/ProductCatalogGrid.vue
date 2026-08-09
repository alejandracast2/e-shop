<script setup>
import { computed, ref } from 'vue'

import { useStorefrontFavoritesStore } from '../../stores/storefrontFavorites'

const props = defineProps({
  products: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  cartLoading: {
    type: Boolean,
    default: false,
  },
  addedVariantIds: {
    type: Array,
    default: () => [],
  },
  showFavoriteButton: {
    type: Boolean,
    default: true,
  },
  loadingMessage: {
    type: String,
    default: 'Cargando productos...',
  },
  emptyMessage: {
    type: String,
    default: 'No hay productos activos para los filtros actuales.',
  },
  locale: {
    type: String,
    default: 'es-CO',
  },
  currency: {
    type: String,
    default: 'COP',
  },
  currencyFormatter: {
    type: Function,
    default: null,
  },
  maxQuantity: {
    type: Number,
    default: 99,
  },
})

const emit = defineEmits(['add-to-cart'])

const favoritesStore = useStorefrontFavoritesStore()

const selectedQuantities = ref({})

const addedVariantIdSet = computed(() =>
  new Set(props.addedVariantIds.filter(Boolean).map((id) => String(id))),
)

function getProductTags(product) {
  return Array.isArray(product?.tags) ? product.tags : []
}

function getProductKey(product) {
  return product?.variantId || product?.id
}

function normalizeQuantity(value) {
  const quantity = Number.parseInt(value, 10)
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1

  if (!Number.isFinite(props.maxQuantity) || props.maxQuantity < 1) {
    return safeQuantity
  }

  return Math.min(safeQuantity, props.maxQuantity)
}

function getSelectedQuantity(product) {
  return selectedQuantities.value[getProductKey(product)] || 1
}

function setSelectedQuantity(product, value) {
  const key = getProductKey(product)
  if (!key) return

  selectedQuantities.value = {
    ...selectedQuantities.value,
    [key]: normalizeQuantity(value),
  }
}

function decrementQuantity(product) {
  setSelectedQuantity(product, Math.max(1, getSelectedQuantity(product) - 1))
}

function incrementQuantity(product) {
  setSelectedQuantity(product, getSelectedQuantity(product) + 1)
}

function formatCurrency(value) {
  if (props.currencyFormatter) {
    return props.currencyFormatter(value)
  }

  return new Intl.NumberFormat(props.locale, {
    style: 'currency',
    currency: props.currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function isDiscountTag(product, tag) {
  return tag === product?.discountTag
}

function isNewTag(tag) {
  return String(tag || '').toLowerCase() === 'nuevo'
}

function isProductAdded(product) {
  return Boolean(product?.variantId) && addedVariantIdSet.value.has(String(product.variantId))
}

function isFavorite(product) {
  return favoritesStore.isFavorite(product)
}

function handleAddToCart(product) {
  emit('add-to-cart', {
    product,
    quantity: getSelectedQuantity(product),
  })
}

function handleToggleFavorite(product) {
  favoritesStore.toggleFavorite(product)
}
</script>

<template>
  <div v-if="loading" class="catalog-status">{{ loadingMessage }}</div>
  <div v-else-if="error" class="catalog-status catalog-status--error">{{ error }}</div>
  <div v-else-if="!products.length" class="catalog-status">
    {{ emptyMessage }}
  </div>

  <div v-else class="catalog-grid">
    <article v-for="product in products" :key="product.id" class="product-card">
      <div class="tags">
        <div v-if="getProductTags(product).length" class="tag-list">
          <span v-for="tag in getProductTags(product)" :key="tag" class="ptag" :class="{
            sale: isDiscountTag(product, tag),
            new: isNewTag(tag),
          }">
            {{ tag }}
          </span>
        </div>
        <span v-if="isProductAdded(product)" class="ptag added">En carrito</span>
      </div>

      <button v-if="showFavoriteButton" class="fav" :class="{ on: isFavorite(product) }" type="button"
        :aria-pressed="isFavorite(product)" :aria-label="isFavorite(product)
          ? `Quitar ${product.title} de favoritos`
          : `Marcar ${product.title} como favorito`" @click="handleToggleFavorite(product)">
        <svg viewBox="0 0 24 24" :fill="isFavorite(product) ? 'currentColor' : 'none'" stroke="currentColor"
          stroke-width="2">
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      <div class="product-visual">
        <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.title" />
        <div v-else class="visual-fallback">
          <span>{{ product.initials }}</span>
        </div>
      </div>

      <div class="pprice">
        <span class="now">{{ formatCurrency(product.price) }}</span>
        <span v-if="product.discountPercent" class="was">
          {{ formatCurrency(product.basePrice) }}
        </span>
      </div>
      <h3 class="pname">{{ product.title }}</h3>

      <div class="pactions">
        <div class="qty">
          <button type="button" :disabled="!product.variantId || cartLoading || getSelectedQuantity(product) <= 1"
            @click="decrementQuantity(product)">
            -
          </button>
          <input type="number" min="1" step="1" :max="maxQuantity" :disabled="!product.variantId || cartLoading"
            :value="getSelectedQuantity(product)" @change="setSelectedQuantity(product, $event.target.value)" />
          <button type="button" :disabled="!product.variantId || cartLoading" @click="incrementQuantity(product)">
            +
          </button>
        </div>
        <button class="addbtn" :class="{ added: isProductAdded(product) }" type="button"
          :disabled="!product.variantId || cartLoading" @click="handleAddToCart(product)">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M2 1C1.44772 1 1 1.44772 1 2C1 2.55228 1.44772 3 2 3H3.21922L6.78345 17.2569C5.73276 17.7236 5 18.7762 5 20C5 21.6569 6.34315 23 8 23C9.65685 23 11 21.6569 11 20C11 19.6494 10.9398 19.3128 10.8293 19H15.1707C15.0602 19.3128 15 19.6494 15 20C15 21.6569 16.3431 23 18 23C19.6569 23 21 21.6569 21 20C21 18.3431 19.6569 17 18 17H8.78078L8.28078 15H18C20.0642 15 21.3019 13.6959 21.9887 12.2559C22.6599 10.8487 22.8935 9.16692 22.975 7.94368C23.0884 6.24014 21.6803 5 20.1211 5H5.78078L5.15951 2.51493C4.93692 1.62459 4.13696 1 3.21922 1H2ZM18 13H7.78078L6.28078 7H20.1211C20.6742 7 21.0063 7.40675 20.9794 7.81078C20.9034 8.9522 20.6906 10.3318 20.1836 11.3949C19.6922 12.4251 19.0201 13 18 13ZM18 20.9938C17.4511 20.9938 17.0062 20.5489 17.0062 20C17.0062 19.4511 17.4511 19.0062 18 19.0062C18.5489 19.0062 18.9938 19.4511 18.9938 20C18.9938 20.5489 18.5489 20.9938 18 20.9938ZM7.00617 20C7.00617 20.5489 7.45112 20.9938 8 20.9938C8.54888 20.9938 8.99383 20.5489 8.99383 20C8.99383 19.4511 8.54888 19.0062 8 19.0062C7.45112 19.0062 7.00617 19.4511 7.00617 20Z"
              fill="currentColor" />
          </svg>
          {{ product.variantId ? (cartLoading ? 'Actualizando...' : 'Agregar') : 'Sin variante' }}
        </button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.catalog-status {
  padding: 32px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(18, 16, 15, 0.08);
  color: var(--text-secondary);
}

.catalog-status--error {
  color: var(--text-brand-dark);
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

@media(min-width:700px) and (max-width:1100px) {
  .catalog-grid {
    grid-template-columns: repeat(3, 1fr)
  }
}
@media (max-width: 760px) {
    .catalog-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
@media(max-width:640px) {
  .catalog-grid {
    grid-template-columns: repeat(2, 1fr)
  }
}

@media(max-width:440px) {
  .catalog-grid {
    grid-template-columns: 1fr
  }
}

.product-card {
  background: #fff;
  padding: 18px 16px 16px;
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 10px;
  border: 1px solid var(--line-2);
  box-shadow: 0 1px 2px rgba(18, 16, 15, 0.04);
  transition: 0.2s box-shadow, 0.2s transform;
}

.fav {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  z-index: 2;
  transition: 0.15s all;
}

.fav:hover,
.fav.on {
  color: var(--text-brand);
}

.fav svg {
  width: 18px;
  height: 18px;
  stroke-width: 1.5;
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

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ptag {
  font-size: 11px;
  letter-spacing: 0.04em;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 0 4px 4px 0;
}

.ptag.sale {
  background: var(--wine);
  color: var(--text-on-dark);
}

.ptag.new {
  background: var(--ink);
  color: var(--text-on-dark);
}

.ptag.added {
  background: var(--bone);
  color: var(--text-brand);
  border: 1px solid var(--wine);
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
  background: linear-gradient(160deg, rgba(179, 38, 30, 0.18), rgba(179, 38, 30, 0.05));
  color: var(--text-brand);
  font-family: var(--font-display);
  font-size: 38px;
  letter-spacing: -0.06em;
}

.pprice {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.pprice .now {
  font-family: var(--font-sans);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.pprice .was {
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: line-through;
  font-weight: 400;
}

.pname {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.3;
  font-weight: 400;
  margin: 0 0 12px;
  letter-spacing: 0;
  color: var(--text-primary);
  min-height: 38px;
}

.pactions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.qty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px;
}

.qty button {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  font-size: 14px;
  background: var(--bone-4);
}

.qty button:last-of-type {
  background: var(--ink);
  color: var(--text-on-dark);
}

.qty button:hover {
  filter: brightness(1.1);
}

.qty button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: none;
}

.qty input {
  flex: 1;
  text-align: center;
  border: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  -moz-appearance: textfield;
  outline: none;
}

.qty input::-webkit-outer-spin-button,
.qty input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.addbtn {
  width: 100%;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--wine);
  color: var(--text-on-dark);
  font-size: 13px;
  letter-spacing: 0.01em;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: 0.15s background;
}

.addbtn:hover {
  background: var(--wine-2);
}

.addbtn.added {
  background: var(--wine-3);
  color: var(--text-on-dark);
}

.addbtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.addbtn svg {
  width: 15px;
  height: 15px;
}
</style>
