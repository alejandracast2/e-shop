<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useStorefrontCatalogStore } from '../../stores/storefrontCatalog'
import { useStorefrontCategoriesStore } from '../../stores/storefrontCategories'

const categoriesStore = useStorefrontCategoriesStore()
const catalogStore = useStorefrontCatalogStore()

const { rootCategories } = storeToRefs(categoriesStore)
const { activeCategoryId } = storeToRefs(catalogStore)

const activeRootCategoryId = computed(() =>
  categoriesStore.getRootCategoryId(activeCategoryId.value),
)

onMounted(() => {
  void categoriesStore.loadCategories()
})

function selectCategory(categoryId) {
  catalogStore.selectCategory(categoryId)
}

function initialsFor(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0])
    .join('')
    .toUpperCase()
}
</script>

<template>
  <section class="category-feature">
    <div class="section-header">
      <div>
        <p class="eyebrow">Seleccion rapida</p>
        <h2>Entra por la puerta correcta</h2>
      </div>
      <p>
        Las categorias vienen del endpoint publico y aqui se muestran como accesos
        directos para navegar el catalogo sin ruido.
      </p>
    </div>

    <div class="circle-grid">
      <button
        v-for="category in rootCategories"
        :key="category.id"
        class="circle-card"
        :class="{ active: activeRootCategoryId === category.id }"
        type="button"
        @click="selectCategory(category.id)"
      >
        <span class="circle-disc">
          <img v-if="category.imageUrl" :src="category.imageUrl" :alt="category.name" />
          <span v-else>{{ initialsFor(category.name) }}</span>
        </span>
        <strong>{{ category.name }}</strong>
        <small>{{ category.childrenCount }} subcategorias</small>
      </button>
    </div>
  </section>
</template>

<style scoped>
.category-feature {
  display: grid;
  gap: 28px;
}

.section-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
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

.section-header h2 {
  margin: 0;
  color: #12100f;
  font-family: 'Georgia', serif;
  font-size: clamp(34px, 4vw, 46px);
  letter-spacing: -0.04em;
}

.section-header p:last-child {
  margin: 0;
  color: #5a514c;
  line-height: 1.7;
}

.circle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
  gap: 16px;
}

.circle-card {
  display: grid;
  gap: 12px;
  justify-items: center;
  padding: 18px 12px;
  border-radius: 22px;
  border: 1px solid rgba(18, 16, 15, 0.07);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 44px -38px rgba(18, 16, 15, 0.5);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.circle-card:hover,
.circle-card.active {
  transform: translateY(-2px);
  border-color: rgba(107, 21, 32, 0.22);
  box-shadow: 0 24px 52px -36px rgba(107, 21, 32, 0.34);
}

.circle-disc {
  width: 108px;
  height: 108px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.8), transparent 46%),
    linear-gradient(180deg, #f5eee3, #ece2d4);
  color: #6b1520;
  font-family: 'Georgia', serif;
  font-size: 26px;
  letter-spacing: -0.05em;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(18, 16, 15, 0.06);
}

.circle-disc img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.circle-card strong {
  color: #12100f;
  font-size: 16px;
}

.circle-card small {
  color: #7d736d;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

@media (max-width: 800px) {
  .section-header {
    grid-template-columns: 1fr;
  }
}
</style>
