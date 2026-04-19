<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import CategoryNav from './components/CategoryNav.vue'
import { useStorefrontCategoriesStore } from './stores/storefrontCategories'

const storefrontCategoriesStore = useStorefrontCategoriesStore()
const { categories, loading, error } = storeToRefs(storefrontCategoriesStore)
const { loadCategories } = storefrontCategoriesStore

const showcaseCategories = computed(() =>
  categories.value.map((category) => ({
    id: category.id,
    name: category.name,
    imageUrl: category.imageUrl,
    childCount: Array.isArray(category.children) ? category.children.length : 0,
  })),
)

void loadCategories()
</script>

<template>
  <CategoryNav />

  <section class="product-wave-section">
    <svg
      class="product-wave-section__wave"
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
    >
      <path
        fill="#efe8db"
        d="M0,192L80,176C160,160,320,128,480,138.7C640,149,800,203,960,202.7C1120,203,1280,149,1360,122.7L1440,96L1440,320L0,320Z"
      />
    </svg>

    <div class="product-wave-section__content">
      <div class="product" v-for="category in showcaseCategories" :key="category.id">
        <img :src="category.imageUrl" class="product__image" alt="Aguardiente" />
        <div class="product__category">{{ category.name }}</div>
      </div>
    </div>
  </section>

  <main class="page">

    <div style="display: flex;">
      <h2>-- Descubre Nuestras Categorías --</h2>
    </div>
    <div style="display: flex;margin-bottom: 40px;justify-content: center;background: #efe8db ;">
      <div class="product" v-for="category in showcaseCategories">
        <img :src="category.imageUrl" class="product__image" alt="Aguardiente" />
        <div class="product__category">{{ category.name }}</div>
      </div>
      
    </div>

    <section class="category-showcase" aria-labelledby="showcase-title">
      <div class="showcase-header">
        <p class="showcase-kicker">Storefront</p>
        <h1 id="showcase-title" class="showcase-title">Seleccion</h1>
        <p class="showcase-copy">
          Las categorias se cargan desde <strong>/storefront/categories</strong> para construir
          la navegacion y destacar la seleccion principal de la tienda.
        </p>
      </div>

      <p v-if="loading" class="showcase-status">Cargando categorias...</p>
      <p v-else-if="error" class="showcase-status error">{{ error }}</p>
      <p v-else-if="showcaseCategories.length === 0" class="showcase-status">
        Sin categorias disponibles.
      </p>
      <div v-else class="showcase-grid">
        <article v-for="category in showcaseCategories" :id="`category-${category.id}`" :key="category.id"
          class="showcase-card">
          <p class="showcase-label">Categoria</p>
          <h2 class="showcase-name">{{ category.name }}</h2>
          <p class="showcase-meta">
            {{ category.childCount }} subcategorias disponibles
          </p>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.product-wave-section {
  margin-bottom: 40px;
}

.product-wave-section__wave {
  display: block;
  width: 100%;
  height: clamp(230px, 11vw, 170px);
}

.product-wave-section__content {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  padding: 0 24px 32px;
  margin-top: -1px;
  background: #efe8db;
}

:global(body) {
  margin: 0;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  color: #141414;
  background: #ffffff;
}

.page {
  padding: 40px 32px;
}

.product {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 150px;
}

.product__image {
  width: 120px;
  height: 139px;
  object-fit: contain;
}

.product__category {
  margin-top: 15px;
  text-transform: uppercase;

}

.category-showcase {
  display: grid;
  gap: 28px;
}

.showcase-header {
  display: grid;
  gap: 12px;
  max-width: 680px;
}

.showcase-kicker {
  margin: 0;
  color: #8d5d21;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2.4px;
  text-transform: uppercase;
}

.showcase-title {
  margin: 0;
  font-size: clamp(32px, 6vw, 56px);
  line-height: 0.95;
}

.showcase-copy {
  margin: 0;
  max-width: 560px;
  color: #3c3c3c;
  line-height: 1.6;
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.showcase-card {
  display: grid;
  gap: 10px;
  padding: 22px;
  border: 1px solid #eadfce;
  border-radius: 20px;
  background: linear-gradient(180deg, #fff9f0 0%, #ffffff 100%);
  box-shadow: 0 18px 32px rgba(69, 41, 16, 0.08);
}

.showcase-label,
.showcase-meta,
.showcase-status {
  margin: 0;
}

.showcase-label {
  color: #8d5d21;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

.showcase-name {
  margin: 0;
  font-size: 28px;
}

.showcase-meta,
.showcase-status {
  color: #4f4f4f;
}

.showcase-status.error {
  color: #b3422a;
}

@media (max-width: 600px) {
  .page {
    padding: 28px 20px;
  }
}
</style>
