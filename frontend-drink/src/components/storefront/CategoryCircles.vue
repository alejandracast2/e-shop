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
  <section style="padding:56px 0 32px">
    <div class="wrap">
      <div class="sec-head">
        <div class="left">
          <div class="eye">Nuestras barras</div>
          <h2>Categorías <em>de la casa</em></h2>
          <!-- <h2>Entra por la <em>puerta correcta</em></h2> -->
        </div>
      </div>
      <div class="cat-circles">
        <div v-for="category in rootCategories" :key="category.id" class="cat-circle"
          :class="{ active: activeRootCategoryId === category.id }" @click="selectCategory(category.id)">
          <div class="cat-disc">
            <img style="height: 100%;" v-if="category.imageUrl" :src="category.imageUrl" :alt="category.name" />
            <span v-else>{{ initialsFor(category.name) }}</span>
          </div>
          <div class="cname">{{ category.name }}</div>
          <div class="ccount">{{ category.childrenCount }} subcategorias</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wrap {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 28px;
}

.sec-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 36px;
  gap: 24px;
}

.sec-head .left .eye {
  font-size: 11px;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sec-head .left .eye::before {
  content: "";
  width: 24px;
  height: 1px;
  background: var(--wine)
}

.sec-head .left h2 {
  font-family: var(--font-display);
  font-size: 42px;
  line-height: 1;
  letter-spacing: -.02em;
  margin: 0;
  font-weight: 700;
}

.sec-head .left h2 em {
  color: var(--text-brand);
  font-weight: 500;
}
 /* ---------- Categorías circulares ---------- */
  .cat-circles{
    display:grid;grid-template-columns:repeat(4,1fr);gap:8px;
  }
  @media (max-width: 1100px) {
    .cat-circles {
        grid-template-columns: repeat(4, 1fr);
    }
}
  .cat-circle{
    text-align:center;cursor:pointer;
    padding:14px 8px;border-radius:12px;
    transition:.2s background;
  }
  .cat-circle:hover{background:var(--bone-2)}
  .cat-disc{
    width:112px;height:112px;border-radius:50%;
    margin:0 auto 14px;
    background:var(--bone-2);
    border:1px solid var(--line);
    place-items:center;
    position:relative;overflow:hidden;
  }
  .cat-disc::before{
    content:"";position:absolute;inset:0;
    background:repeating-linear-gradient( 45deg, rgba(18,16,15,.03) 0 6px, transparent 6px 12px);
  }
  .cat-disc .mini-bottle{
    width:28px;height:76px;border-radius: 40% 40% 4px 4px / 10% 10% 4px 4px;
    position:relative;z-index:1;
  }
  .cat-disc .mini-bottle::before{
    content:"";position:absolute;left:50%;top:-10px;transform:translateX(-50%);
    width:10px;height:16px;background:inherit;filter:brightness(.5);border-radius:2px 2px 0 0;
  }
  .cat-disc .mini-bottle::after{
    content:"";position:absolute;left:3px;right:3px;top:20px;bottom:6px;
    background:var(--bone);border-radius:2px;
  }
  .cat-circle .cname{
    font-family:var(--font-display);
    font-size:16px;font-weight:600;
  }
  .cat-circle .ccount{
    font-size:10px;letter-spacing:.2em;text-transform:uppercase;
    color:var(--text-secondary);margin-top:3px;
  }
  .cat-circle.active .cat-disc{
    border-color:var(--wine);
    background:var(--wine-wash);
    box-shadow:0 0 0 4px var(--bone), 0 0 0 5px var(--wine);
  }
/* lo que estaba adiccionalemente */
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
  color: var(--text-brand);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.section-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: clamp(34px, 4vw, 46px);
  letter-spacing: -0.04em;
}

.section-header p:last-child {
  margin: 0;
  color: var(--text-secondary);
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
  border-color: rgba(179, 38, 30, 0.22);
  box-shadow: 0 24px 52px -36px rgba(179, 38, 30, 0.34);
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
  color: var(--text-brand);
  font-family: var(--font-display);
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
  color: var(--text-primary);
  font-size: 16px;
}

.circle-card small {
  color: var(--text-secondary);
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
