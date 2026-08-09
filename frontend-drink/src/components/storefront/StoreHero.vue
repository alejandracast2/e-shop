<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useStorefrontCategoriesStore } from '../../stores/storefrontCategories'
import { useStorefrontProductsStore } from '../../stores/storefrontProducts'
import { useStorefrontUiStore } from '../../stores/storefrontUi'

const categoriesStore = useStorefrontCategoriesStore()
const productsStore = useStorefrontProductsStore()
const uiStore = useStorefrontUiStore()

const { rootCategories } = storeToRefs(categoriesStore)
const { catalogProducts } = storeToRefs(productsStore)

const featuredProduct = computed(() => catalogProducts.value[0] ?? null)
const categoryCount = computed(() => rootCategories.value.length)
const productCount = computed(() => catalogProducts.value.length)

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

function scrollToCatalog() {
  if (typeof document === 'undefined') return
  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <section class="hero" id="top">
    <div class="hero-shell">
      <div class="hero-copy">
        <p class="hero-kicker">Seleccion curada para brindar mejor</p>
        <h1>
          Bodega digital con
          <em>alma de cantina</em>
        </h1>
        <p class="hero-lede">
          Descubre etiquetas activas del storefront, filtra por categoria y arma una
          canasta conectada a tu backend actual.
        </p>

        <div class="hero-actions">
          <button class="primary-button" type="button" @click="scrollToCatalog">
            Explorar catalogo
          </button>
          <button class="ghost-button" type="button" @click="uiStore.openCart">
            Ver canasta
          </button>
        </div>

        <div class="hero-stats">
          <article>
            <strong>{{ categoryCount }}</strong>
            <span>Categorias cargadas</span>
          </article>
          <article>
            <strong>{{ productCount }}</strong>
            <span>Productos visibles</span>
          </article>
          <article>
            <strong>Storefront</strong>
            <span>Conectado con API</span>
          </article>
        </div>
      </div>

      <aside class="hero-card">
        <p class="card-kicker">Destacado de la casa</p>
        <h2>{{ featuredProduct?.title || 'Seleccion principal' }}</h2>
        <p>
          {{
            featuredProduct?.description ||
            'La portada toma el primer producto disponible y lo presenta como pieza destacada.'
          }}
        </p>

        <div class="card-meta">
          <span>{{ featuredProduct?.categoryName || 'Catalogo general' }}</span>
          <strong>{{ formatCurrency(featuredProduct?.price) }}</strong>
        </div>

        <div class="card-visual">
          <img
            v-if="featuredProduct?.imageUrl"
            :src="featuredProduct.imageUrl"
            :alt="featuredProduct.title"
          />
          <div v-else class="visual-fallback">
            <span>{{ featuredProduct?.initials || 'LC' }}</span>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 42px 0 26px;
}

.hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 30px;
  align-items: stretch;
}

.hero-copy,
.hero-card {
  border-radius: 28px;
}

.hero-copy {
  padding: 44px;
  background:
    radial-gradient(circle at top right, rgba(179, 38, 30, 0.16), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(244, 238, 228, 0.9));
  border: 1px solid rgba(18, 16, 15, 0.08);
  box-shadow: 0 26px 60px -42px rgba(40, 18, 20, 0.45);
}

.hero-kicker,
.card-kicker {
  margin: 0 0 18px;
  color: var(--text-brand);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0;
  max-width: 10ch;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: clamp(48px, 8vw, 82px);
  line-height: 0.94;
  letter-spacing: -0.05em;
}

.hero-copy h1 em {
  color: var(--text-brand);
  font-style: italic;
  font-weight: 600;
}

.hero-lede {
  max-width: 560px;
  margin: 22px 0 0;
  color: var(--text-secondary);
  font-size: 17px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.primary-button,
.ghost-button {
  padding: 14px 22px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.primary-button {
  background: var(--wine);
  color: var(--text-on-dark);
}

.ghost-button {
  border: 1px solid rgba(18, 16, 15, 0.16);
  color: var(--text-primary);
  background: transparent;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 34px;
  padding-top: 24px;
  border-top: 1px solid rgba(18, 16, 15, 0.08);
}

.hero-stats article {
  display: grid;
  gap: 4px;
}

.hero-stats strong {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 34px);
  letter-spacing: -0.05em;
}

.hero-stats span {
  color: var(--text-secondary);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.hero-card {
  display: grid;
  gap: 18px;
  padding: 34px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.12), transparent 24%),
    linear-gradient(160deg, #241815, #0d0a09 72%);
  color: var(--text-on-dark);
  box-shadow: 0 32px 70px -40px rgba(18, 16, 15, 0.9);
}

.hero-card h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(34px, 5vw, 48px);
  line-height: 0.96;
  letter-spacing: -0.04em;
}

.hero-card p {
  margin: 0;
  color: rgba(246, 240, 230, .75);
  line-height: 1.7;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid rgba(250, 247, 242, 0.12);
  border-bottom: 1px solid rgba(250, 247, 242, 0.12);
}

.card-meta span {
  color: rgba(246, 240, 230, .68);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.card-meta strong {
  color: var(--text-accent);
  font-family: var(--font-display);
  font-size: 28px;
}

.card-visual {
  min-height: 250px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent),
    rgba(255, 255, 255, 0.04);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.card-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.visual-fallback {
  width: 170px;
  height: 170px;
  border-radius: 36px;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, rgba(234, 183, 191, 0.18), rgba(179, 38, 30, 0.22));
  box-shadow: inset 0 0 0 1px rgba(250, 247, 242, 0.12);
}

.visual-fallback span {
  color: var(--text-accent);
  font-family: var(--font-display);
  font-size: 52px;
  letter-spacing: -0.06em;
}

@media (max-width: 980px) {
  .hero-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero {
    padding-top: 26px;
  }

  .hero-copy,
  .hero-card {
    padding: 28px 22px;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }
}
</style>
