<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { useStorefrontCartStore } from '../stores/storefrontCart'
import { useStorefrontCatalogStore } from '../stores/storefrontCatalog'
import { useStorefrontCategoriesStore } from '../stores/storefrontCategories'
import { useStorefrontFavoritesStore } from '../stores/storefrontFavorites'
import { useStorefrontUiStore } from '../stores/storefrontUi'

const router = useRouter()
const categoriesStore = useStorefrontCategoriesStore()
const catalogStore = useStorefrontCatalogStore()
const cartStore = useStorefrontCartStore()
const favoritesStore = useStorefrontFavoritesStore()
const uiStore = useStorefrontUiStore()

const { rootCategories, loading, error } = storeToRefs(categoriesStore)
const { activeCategoryId, searchQuery } = storeToRefs(catalogStore)
const { cartCount } = storeToRefs(cartStore)
const { favoriteCount } = storeToRefs(favoritesStore)

const previewCategoryId = ref('')

const activeRootCategoryId = computed(() =>
  categoriesStore.getRootCategoryId(activeCategoryId.value),
)

const currentPreviewCategory = computed(() => {
  return rootCategories.value.find((category) => category.id === previewCategoryId.value) ?? null
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
  router.push({ name: 'products' })
  catalogStore.selectCategory(categoryId)
  previewCategoryId.value = ''
}
</script>

<template>
  <header class="site">
    <div class="wrap hrow">
      <router-link :to="{
        name: 'home'
      }" class="brand">
        <span class="brand-mark">LC</span>
        <span class="brand-text">
          <div class="name" style="font-family: Raleway; font-weight: 600">La <em>Cantina</em></div>
          <div class="sub">Vinos · Licores · Añejos</div>
        </span>
      </router-link>
      <div class="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input placeholder="Busca vinos, whiskies, reservas…" :value="searchQuery" type="search" @input="handleInput" />
      </div>
      <div class="htools">
        <div class="locator">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s-7-7.58-7-12a7 7 0 1 1 14 0c0 4.42-7 12-7 12z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <div>
            <div class="lbl">Envío a</div>
            <b>Bogotá D.C.</b>
          </div>
        </div>
        <button class="icon-btn" title="Notificaciones">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z" />
            <path d="M10 21a2 2 0 0 0 4 0" />
          </svg>
        </button>
        <router-link class="icon-btn" title="Favoritos" :to="{ name: 'favorites' }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span class="badge" v-if="favoriteCount">{{ favoriteCount }}</span>
        </router-link>
        <button class="icon-btn" title="Cuenta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
        </button>
        <button class="icon-btn" title="Canasta" @click="uiStore.openCart"
          style="background:var(--wine);color:var(--bone)">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M2 1C1.44772 1 1 1.44772 1 2C1 2.55228 1.44772 3 2 3H3.21922L6.78345 17.2569C5.73276 17.7236 5 18.7762 5 20C5 21.6569 6.34315 23 8 23C9.65685 23 11 21.6569 11 20C11 19.6494 10.9398 19.3128 10.8293 19H15.1707C15.0602 19.3128 15 19.6494 15 20C15 21.6569 16.3431 23 18 23C19.6569 23 21 21.6569 21 20C21 18.3431 19.6569 17 18 17H8.78078L8.28078 15H18C20.0642 15 21.3019 13.6959 21.9887 12.2559C22.6599 10.8487 22.8935 9.16692 22.975 7.94368C23.0884 6.24014 21.6803 5 20.1211 5H5.78078L5.15951 2.51493C4.93692 1.62459 4.13696 1 3.21922 1H2ZM18 13H7.78078L6.28078 7H20.1211C20.6742 7 21.0063 7.40675 20.9794 7.81078C20.9034 8.9522 20.6906 10.3318 20.1836 11.3949C19.6922 12.4251 19.0201 13 18 13ZM18 20.9938C17.4511 20.9938 17.0062 20.5489 17.0062 20C17.0062 19.4511 17.4511 19.0062 18 19.0062C18.5489 19.0062 18.9938 19.4511 18.9938 20C18.9938 20.5489 18.5489 20.9938 18 20.9938ZM7.00617 20C7.00617 20.5489 7.45112 20.9938 8 20.9938C8.54888 20.9938 8.99383 20.5489 8.99383 20C8.99383 19.4511 8.54888 19.0062 8 19.0062C7.45112 19.0062 7.00617 19.4511 7.00617 20Z"
              fill="currentColor" />
          </svg>
          <span class="badge" v-if="cartCount" style="top: -5px;right: -1px;" >{{ cartCount }}</span>
        </button>
      </div>
    </div>

    <nav class="category-nav" aria-label="Categorias" @mouseleave="clearCategoryPreview">
      <div class="category-shell">
        <button class="category-link" :class="{ active: !activeCategoryId }" type="button" @click="selectCategory('')">
          Toda la bodega
        </button>

        <template v-if="!loading && !error">
          <button v-for="category in rootCategories" :key="category.id" class="category-link"
            :class="{ active: activeRootCategoryId === category.id }" type="button"
            @mouseenter="showCategoryPreview(category)" @focus="showCategoryPreview(category)"
            @click="selectCategory(category.id)">
            {{ category.name }}
          </button>
        </template>

        <span v-if="loading" class="nav-status">Cargando categorias...</span>
        <span v-else-if="error" class="nav-status nav-status--error">{{ error }}</span>
      </div>

      <div v-if="currentPreviewCategory && hasChildren(currentPreviewCategory)">

        <div class="submenu-inner">
          <ul class="submenu-list">
            <li v-for="child in currentPreviewCategory.children" :key="child.id" @click="selectCategory(child.id)">
              <a class="submenu-link">{{ child.name }}</a>
            </li>
          </ul>
          <div class="submenu-list submenu-meta">
            <a class="submenu-link" href="#">Ver todos</a>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.submenu-inner {
  display: flex;
  gap: 64px;
  padding: 24px 32px 32px;
  max-width: 1100px;
}

.submenu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.submenu-link {
  text-decoration: none;
  color: var(--white);
  font-size: 12px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  font-weight: 600;
}

.submenu-link:hover {
  color: var(--soft);
}

.submenu-meta {
  padding-left: 32px;
  border-left: 1px solid #f0f0f0;
}


/* ---------- Header ---------- */
.wrap {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 28px
}

header.site {
  background: var(--bone);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 40;
}

.hrow {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 36px;
  padding: 22px 0 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--wine);
  display: grid;
  place-items: center;
  color: var(--bone);
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 700;
  font-size: 24px;
  box-shadow: inset 0 0 0 2px var(--wine-3), 0 0 0 3px var(--bone), 0 0 0 4px var(--wine);
}

.brand-text {
  line-height: 1
}

.brand-text .name {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -.01em;
}

.brand-text .name em {
  color: var(--wine);
  font-style: italic;
  font-weight: 500
}

.brand-text .sub {
  font-size: 10px;
  letter-spacing: .42em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-top: 4px;
}

.search {
  position: relative;
  max-width: 520px;
  width: 100%;
  justify-self: center;
}

.search input {
  width: 100%;
  border: 1px solid var(--line);
  background: var(--bone-2);
  padding: 13px 18px 13px 44px;
  border-radius: 999px;
  font-size: 14px;
  outline: none;
  transition: .2s border-color, .2s background;
}

.search input:focus {
  border-color: var(--wine);
  background: #fff
}

.search svg {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--ink-3);
}

.htools {
  display: flex;
  align-items: center;
  gap: 8px
}

.icon-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--ink);
  position: relative;
  transition: .15s background;
}

.icon-btn:hover {
  background: var(--bone-2)
}

.icon-btn svg {
  width: 18px;
  height: 18px
}

.icon-btn .badge {
  position: absolute;
  top: 3px;
  right: 3px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--wine);
  color: var(--bone);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  display: grid;
  place-items: center;
  border: 2px solid var(--bone);
}

.locator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  font-size: 12px;
}

.locator .lbl {
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: .12em;
  font-size: 10px
}

.locator b {
  font-weight: 600;
  border-bottom: 1px dashed var(--wine);
  color: var(--wine)
}





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

/* .brand-mark {
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
} */

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
  color: var(--white);
}

.category-link.active::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 10px;
  height: 2px;
  border-radius: 999px;
  background: var(--wine);
}

.nav-status {
  padding: 16px 14px;
  color: var(--white);
  font-size: 12px;
}

.nav-status--error {
  color: var(-soft);
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
  color: var(--soft);
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
