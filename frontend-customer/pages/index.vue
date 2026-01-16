<template>
  <section class="hero section">
    <div class="container hero-grid">
      <div class="fade-up">
        <div class="eyebrow">E-shop listo para lanzar</div>
        <h1 class="title">
          Productos que se sienten hechos a mano para tus dias ocupados.
        </h1>
        <p class="subtitle">
          Navega la coleccion, guarda tus favoritos y compra en un flujo simple
          conectado al backend en tiempo real.
        </p>
        <div class="hero-actions">
          <NuxtLink class="btn btn-primary" to="#productos">Explorar catalogo</NuxtLink>
          <NuxtLink class="btn btn-ghost" to="/cart">Ver carrito</NuxtLink>
        </div>
      </div>
      <div class="card hero-card fade-up">
        <div class="hero-card-top">
          <span class="tag">Nuevo en stock</span>
          <span class="tag">Envio express</span>
        </div>
        <div class="hero-card-body">
          <h2>Kit Ritual de Manana</h2>
          <p>Combos curados con inventario y precio sincronizado.</p>
        </div>
        <div class="hero-card-footer">
          <span>$72.00</span>
          <button class="btn btn-primary" type="button">Agregar rapido</button>
        </div>
      </div>
    </div>
  </section>

  <section id="productos" class="section">
    <div class="container">
      <div class="section-head">
        <div>
          <div class="eyebrow">Catalogo</div>
          <h2 class="title">Seleccion actual</h2>
        </div>
        <p class="subtitle">
          Productos activos cargados desde la API. Actualiza el stock desde el
          panel admin.
        </p>
      </div>

      <div v-if="pending" class="loading">Cargando productos...</div>
      <div v-else-if="error" class="loading error">
        No se pudo cargar el catalogo.
      </div>
      <div v-else class="grid grid-3 stagger">
        <ProductCard
          v-for="product in safeProducts"
          :key="product.id"
          :product="product"
        />
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container grid grid-3">
      <div class="card">
        <h3>Inventario en vivo</h3>
        <p class="subtitle">
          Cambios en productos se reflejan de inmediato para compradores.
        </p>
      </div>
      <div class="card">
        <h3>Checkout rapido</h3>
        <p class="subtitle">
          Paga sin fricciones y guarda datos de envio para futuras compras.
        </p>
      </div>
      <div class="card">
        <h3>Pedidos claros</h3>
        <p class="subtitle">
          Confirmaciones con estado y seguimiento disponibles al instante.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Product } from '~/types';

const config = useRuntimeConfig();
const { data: products, pending, error } = await useFetch<Product[]>('/products', {
  baseURL: config.public.apiUrl,
  query: { active: 'true' },
});

const safeProducts = computed(() => products.value ?? []);
</script>

<style scoped>
.hero {
  padding-top: 80px;
}

.hero-grid {
  display: grid;
  gap: 32px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  align-items: center;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.hero-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-card-top {
  display: flex;
  gap: 10px;
}

.hero-card-body h2 {
  font-family: 'Fraunces', serif;
  margin: 0 0 6px;
}

.hero-card-body p {
  margin: 0;
  color: var(--muted);
}

.hero-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.loading {
  padding: 30px 0;
  color: var(--muted);
}

.loading.error {
  color: var(--accent-strong);
}
</style>
