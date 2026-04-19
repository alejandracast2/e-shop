<script setup>
import { computed } from 'vue'

import CategoryNav from './components/CategoryNav.vue'
import { useStorefrontCategories } from './composables/useStorefrontCategories'

const { categories, loading, error, loadCategories } = useStorefrontCategories()

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
  <main class="page">
    <div style="display: flex;margin-bottom: 40px;justify-content: center;">
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
