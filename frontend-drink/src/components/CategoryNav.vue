<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import { useStorefrontCartStore } from '../stores/storefrontCart'
import { useStorefrontCatalogStore } from '../stores/storefrontCatalog'
import { useStorefrontCategoriesStore } from '../stores/storefrontCategories'
import { useStorefrontUiStore } from '../stores/storefrontUi'

const categoriesStore = useStorefrontCategoriesStore()
const catalogStore = useStorefrontCatalogStore()
const cartStore = useStorefrontCartStore()
const uiStore = useStorefrontUiStore()

const { rootCategories, loading, error } = storeToRefs(categoriesStore)
const { activeCategoryId, searchQuery } = storeToRefs(catalogStore)
const { cartCount } = storeToRefs(cartStore)

const previewCategoryId = ref('')

const activeRootCategoryId = computed(() =>
  categoriesStore.getRootCategoryId(activeCategoryId.value),
)

const currentPreviewCategory = computed(() => {
  const sourceId = previewCategoryId.value || activeRootCategoryId.value
  return rootCategories.value.find((category) => category.id === sourceId) ?? null
})

onMounted(() => {
  void categoriesStore.loadCategories()
})

function hasChildren(category) {
  return Array.isArray(category.children) && category.children.length > 0
}

function handleInput(event) {
  catalogStore.setSearchQuery(event.target.value)
}

function showCategoryPreview(category) {
  previewCategoryId.value = category.id
}

function clearCategoryPreview() {
  previewCategoryId.value = ''
}

function selectCategory(categoryId) {
  catalogStore.selectCategory(categoryId)
  previewCategoryId.value = categoriesStore.getRootCategoryId(categoryId)
}
</script>

<template>
  <header class="site-header">
    <div class="header-shell">
      <div class="brand-block">
        <span class="brand-mark">LC</span>
        <div class="brand-copy">
          <a class="brand-title" href="#top">La Cantina</a>
          <p class="brand-subtitle">Vinos, licores y entregas el mismo dia</p>
        </div>
      </div>

      <label class="search-bar" aria-label="Buscar en el catalogo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          :value="searchQuery"
          type="search"
          placeholder="Buscar etiquetas, marcas o estilos"
          @input="handleInput"
        />
      </label>

      <div class="header-actions">
        <div class="status-pill">
          <span class="status-label">Entrega</span>
          <strong>Bogota 90 min</strong>
        </div>

        <button class="cart-button" type="button" @click="uiStore.openCart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 7h12l-1.5 11a2 2 0 0 1-2 1.8h-5a2 2 0 0 1-2-1.8L6 7z" />
            <path d="M9 7V5a3 3 0 0 1 6 0v2" />
          </svg>
          <span>Canasta</span>
          <span v-if="cartCount" class="cart-badge">{{ cartCount }}</span>
        </button>
      </div>
    </div>

    <nav class="category-nav" aria-label="Categorias" @mouseleave="clearCategoryPreview">
      <div class="category-shell">
        <button
          class="category-link"
          :class="{ active: !activeCategoryId }"
          type="button"
          @click="selectCategory('')"
        >
          Toda la bodega
        </button>

        <template v-if="!loading && !error">
          <button
            v-for="category in rootCategories"
            :key="category.id"
            class="category-link"
            :class="{ active: activeRootCategoryId === category.id }"
            type="button"
            @mouseenter="showCategoryPreview(category)"
            @focus="showCategoryPreview(category)"
            @click="selectCategory(category.id)"
          >
            {{ category.name }}
          </button>
        </template>

        <span v-if="loading" class="nav-status">Cargando categorias...</span>
        <span v-else-if="error" class="nav-status nav-status--error">{{ error }}</span>
      </div>

      <div
        v-if="currentPreviewCategory && hasChildren(currentPreviewCategory)"
        class="submenu-panel"
      >
        <div class="submenu-copy">
          <p class="submenu-kicker">Explorar</p>
          <h2>{{ currentPreviewCategory.name }}</h2>
          <p>
            Encuentra subcategorias y colecciones relacionadas para navegar mas rapido.
          </p>
        </div>

        <div class="submenu-links">
          <button
            v-for="child in currentPreviewCategory.children"
            :key="child.id"
            class="submenu-link"
            type="button"
            @click="selectCategory(child.id)"
          >
            {{ child.name }}
          </button>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(18px);
}

.header-shell {
  display: grid;
  grid-template-columns: auto minmax(260px, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding: 22px 28px 18px;
  background: rgba(250, 247, 242, 0.94);
  border-bottom: 1px solid rgba(18, 16, 15, 0.08);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(160deg, #5d101b, #7e2030);
  color: #faf7f2;
  font-family: 'Georgia', serif;
  font-size: 16px;
  letter-spacing: 0.12em;
  box-shadow:
    0 0 0 2px rgba(250, 247, 242, 0.95),
    0 0 0 3px rgba(93, 16, 27, 0.7);
}

.brand-copy {
  display: grid;
  gap: 4px;
}

.brand-title {
  color: #12100f;
  text-decoration: none;
  font-family: 'Georgia', serif;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.brand-subtitle {
  margin: 0;
  color: #5a514c;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-bar svg {
  position: absolute;
  left: 16px;
  width: 17px;
  height: 17px;
  color: #7d736d;
}

.search-bar input {
  width: 100%;
  border: 1px solid rgba(18, 16, 15, 0.1);
  background: rgba(241, 236, 226, 0.95);
  color: #12100f;
  border-radius: 999px;
  padding: 14px 18px 14px 44px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.search-bar input:focus {
  border-color: rgba(107, 21, 32, 0.6);
  background: #ffffff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-pill {
  display: grid;
  gap: 2px;
  padding: 9px 14px;
  border: 1px solid rgba(18, 16, 15, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
}

.status-label {
  color: #7d736d;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.status-pill strong {
  color: #6b1520;
  font-size: 12px;
}

.cart-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border: 0;
  border-radius: 999px;
  background: #12100f;
  color: #faf7f2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.cart-button svg {
  width: 16px;
  height: 16px;
}

.cart-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #8f2230;
  color: #faf7f2;
  font-size: 11px;
  letter-spacing: 0;
}

.category-nav {
  background: #12100f;
  color: #faf7f2;
  border-bottom: 1px solid rgba(250, 247, 242, 0.08);
}

.category-shell {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 18px;
  overflow-x: auto;
  scrollbar-width: none;
}

.category-shell::-webkit-scrollbar {
  display: none;
}

.category-link {
  position: relative;
  padding: 16px 14px;
  white-space: nowrap;
  border: 0;
  background: transparent;
  color: rgba(250, 247, 242, 0.7);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.category-link.active,
.category-link:hover,
.category-link:focus-visible {
  color: #ffffff;
}

.category-link.active::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 10px;
  height: 2px;
  border-radius: 999px;
  background: #a73443;
}

.nav-status {
  padding: 16px 14px;
  color: rgba(250, 247, 242, 0.7);
  font-size: 12px;
}

.nav-status--error {
  color: #f7b6bf;
}

.submenu-panel {
  display: grid;
  grid-template-columns: minmax(220px, 320px) 1fr;
  gap: 28px;
  padding: 22px 28px 28px;
  background: rgba(27, 23, 21, 0.98);
  border-top: 1px solid rgba(250, 247, 242, 0.08);
}

.submenu-copy {
  display: grid;
  gap: 8px;
}

.submenu-kicker {
  margin: 0;
  color: #e4b6bd;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.submenu-copy h2 {
  margin: 0;
  font-family: 'Georgia', serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.submenu-copy p {
  margin: 0;
  color: rgba(250, 247, 242, 0.72);
  line-height: 1.6;
}

.submenu-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-content: flex-start;
}

.submenu-link {
  padding: 11px 16px;
  border-radius: 999px;
  border: 1px solid rgba(250, 247, 242, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: #faf7f2;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.submenu-link:hover,
.submenu-link:focus-visible {
  border-color: rgba(167, 52, 67, 0.7);
  background: rgba(167, 52, 67, 0.14);
}

@media (max-width: 980px) {
  .header-shell {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .header-actions {
    justify-content: space-between;
  }

  .submenu-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .header-shell {
    padding: 18px 18px 16px;
  }

  .brand-title {
    font-size: 24px;
  }

  .brand-subtitle {
    letter-spacing: 0.12em;
  }

  .status-pill {
    display: none;
  }

  .cart-button {
    margin-left: auto;
  }

  .category-shell {
    padding: 0 10px;
  }
}
</style>
