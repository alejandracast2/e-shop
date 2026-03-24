<script setup>
import CategoryNav from './components/CategoryNav.vue'
</script>

<template>
  <CategoryNav />

  <main class="page">
    <h1>Explora el catalogo</h1>
    <p>
      Las categorias se cargan desde <strong>/storefront/categories</strong> para construir
      el menu de navegacion.
    </p>
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

.page h1 {
  margin: 0 0 12px;
  font-size: 32px;
}

.page p {
  margin: 0;
  max-width: 520px;
  color: #3c3c3c;
}

@media (max-width: 600px) {
  .page {
    padding: 28px 20px;
  }
}
</style>
