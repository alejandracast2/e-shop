<script setup>
import StoreHero from '../components/storefront/StoreHero.vue'
import CategoryCircles from '../components/storefront/CategoryCircles.vue'
import ProductCatalog from '../components/storefront/ProductCatalog.vue'
import StoreFeature from '../components/storefront/StoreFeature.vue'
</script>
<template>

    <main class="page-content">
        <!-- <StoreHero /> -->

        <CategoryCircles />

        <ProductCatalog />

        <StoreFeature />
    </main>
</template>
<style>
.page-content {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  display: grid;
  gap: 34px;
  padding: 0 0 50px;
}

@media (max-width: 720px) {

  .page-content {
    width: min(1240px, calc(100% - 20px));
    gap: 24px;
  }
}
</style>
