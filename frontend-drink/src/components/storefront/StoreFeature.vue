<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useStorefrontProductsStore } from '../../stores/storefrontProducts'

const productsStore = useStorefrontProductsStore()

const { catalogProducts } = storeToRefs(productsStore)

const featuredProduct = computed(() => catalogProducts.value[0] ?? null)

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}
</script>

<template>
  <section class="feature-strip">
    <div class="feature-copy">
      <p class="eyebrow">Como se integra</p>
      <h2>Diseño editorial arriba, datos reales por debajo</h2>
      <p>
        La maqueta original se convirtió en componentes Vue que consumen
        `categories`, `products` y `cart` desde tus stores. El siguiente paso natural es
        sumar detalle de producto y checkout completo.
      </p>
    </div>

    <article class="feature-card">
      <p class="feature-label">Producto de portada</p>
      <h3>{{ featuredProduct?.title || 'Sin producto destacado' }}</h3>
      <div class="feature-meta">
        <span>{{ featuredProduct?.categoryName || 'Storefront' }}</span>
        <strong>{{ formatCurrency(featuredProduct?.price) }}</strong>
      </div>
    </article>
  </section>
</template>

<style scoped>
.feature-strip {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 24px;
  padding: 32px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(143, 34, 48, 0.16), transparent 30%),
    linear-gradient(160deg, #161210, #090707 72%);
  color: #faf7f2;
}

.eyebrow {
  margin: 0 0 12px;
  color: #ebb7c0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.feature-copy h2,
.feature-card h3 {
  margin: 0;
  font-family: 'Georgia', serif;
  letter-spacing: -0.05em;
}

.feature-copy h2 {
  font-size: clamp(34px, 4vw, 50px);
}

.feature-copy p:last-child {
  margin: 18px 0 0;
  max-width: 58ch;
  color: rgba(250, 247, 242, 0.75);
  line-height: 1.75;
}

.feature-card {
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 24px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(250, 247, 242, 0.1);
}

.feature-label {
  margin: 0;
  color: rgba(250, 247, 242, 0.62);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.feature-card h3 {
  font-size: 32px;
}

.feature-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding-top: 18px;
  border-top: 1px solid rgba(250, 247, 242, 0.1);
}

.feature-meta span {
  color: rgba(250, 247, 242, 0.72);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.18em;
}

.feature-meta strong {
  color: #f0d2d7;
  font-family: 'Georgia', serif;
  font-size: 28px;
}

@media (max-width: 900px) {
  .feature-strip {
    grid-template-columns: 1fr;
  }
}
</style>
