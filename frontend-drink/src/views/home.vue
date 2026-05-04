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
  margin: 0 auto;
  gap: 34px;
  padding: 0 0 50px;
  margin: 0 20px;
}

@media (max-width: 720px) {

  .page-content {
    gap: 24px;
  }
}
</style>
