<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useStorefrontCartStore } from '../../stores/storefrontCart'
import { useStorefrontUiStore } from '../../stores/storefrontUi'

const cartStore = useStorefrontCartStore()
const uiStore = useStorefrontUiStore()

const { cartItems, subtotal, shipping, total, loading, error } = storeToRefs(cartStore)
const { cartOpen } = storeToRefs(uiStore)

onMounted(() => {
  void cartStore.restorePersistedCart()
})

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function initialsFor(title) {
  return String(title || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0])
    .join('')
    .toUpperCase()
}

function changeQuantity(item, quantity) {
  void cartStore.changeCartQuantity(item, quantity)
}
</script>

<template>
  <div class="drawer-layer" :class="{ visible: cartOpen }">
    <button class="drawer-overlay" type="button" @click="uiStore.closeCart" />

    <aside class="drawer">
      <header class="drawer-header">
        <div>
          <p class="drawer-kicker">Tu canasta</p>
          <h2>Resumen en vivo</h2>
        </div>

        <button class="close-button" type="button" @click="uiStore.closeCart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <p v-if="error" class="drawer-error">{{ error }}</p>

      <div v-if="!cartItems.length" class="drawer-empty">
        <span class="empty-mark">LC</span>
        <h3>La canasta esta vacia</h3>
        <p>Agrega productos del catalogo y aqui se reflejaran con el carrito real.</p>
      </div>

      <div v-else class="drawer-body">
        <article v-for="item in cartItems" :key="item.id" class="drawer-item">
          <div class="item-mark">{{ initialsFor(item.title) }}</div>

          <div class="item-copy">
            <strong>{{ item.title }}</strong>
            <div class="item-price">
              <span>{{ formatCurrency(item.unitPrice) }}</span>
              <span v-if="item.discountPercent" class="item-price-old">
                {{ formatCurrency(item.baseUnitPrice) }}
              </span>
            </div>
          </div>

          <div class="item-actions">
            <button
              type="button"
              :disabled="loading || item.quantity <= 1"
              @click="changeQuantity(item, item.quantity - 1)"
            >
              -
            </button>
            <span>{{ item.quantity }}</span>
            <button
              type="button"
              :disabled="loading"
              @click="changeQuantity(item, item.quantity + 1)"
            >
              +
            </button>
          </div>
        </article>
      </div>

      <footer class="drawer-footer">
        <div class="summary-row">
          <span>Subtotal</span>
          <strong>{{ formatCurrency(subtotal) }}</strong>
        </div>
        <div class="summary-row">
          <span>Envio</span>
          <strong>{{ shipping ? formatCurrency(shipping) : 'Gratis' }}</strong>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <strong>{{ formatCurrency(total) }}</strong>
        </div>
        <p class="checkout-note">
          El backend actual soporta carrito y checkout. Esta vista deja lista la canasta para
          conectar el formulario de confirmacion en el siguiente paso.
        </p>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.drawer-layer {
  position: fixed;
  inset: 0;
  z-index: 70;
  pointer-events: none;
}

.drawer-layer.visible {
  pointer-events: auto;
}

.drawer-overlay {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(10, 8, 7, 0.56);
  opacity: 0;
  transition: opacity 0.22s ease;
}

.drawer-layer.visible .drawer-overlay {
  opacity: 1;
}

.drawer {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 20px;
  padding: 24px;
  background: #faf7f2;
  box-shadow: -18px 0 48px rgba(18, 16, 15, 0.18);
  transform: translateX(100%);
  transition: transform 0.22s ease;
}

.drawer-layer.visible .drawer {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.drawer-kicker {
  margin: 0 0 8px;
  color: #7b1f2c;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.drawer-header h2 {
  margin: 0;
  color: #12100f;
  font-family: 'Georgia', serif;
  font-size: 34px;
  letter-spacing: -0.05em;
}

.close-button {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(18, 16, 15, 0.08);
  background: #ffffff;
}

.close-button svg {
  width: 16px;
  height: 16px;
}

.drawer-error {
  margin: 0;
  color: #8e2f3c;
}

.drawer-empty {
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  gap: 12px;
  color: #5a514c;
}

.empty-mark {
  width: 78px;
  height: 78px;
  display: grid;
  place-items: center;
  border-radius: 26px;
  background: linear-gradient(160deg, rgba(107, 21, 32, 0.12), rgba(107, 21, 32, 0.04));
  color: #6b1520;
  font-family: 'Georgia', serif;
  font-size: 28px;
}

.drawer-empty h3 {
  margin: 0;
  color: #12100f;
}

.drawer-empty p {
  margin: 0;
  max-width: 28ch;
  line-height: 1.7;
}

.drawer-body {
  display: grid;
  align-content: start;
  gap: 14px;
  overflow: auto;
}

.drawer-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(18, 16, 15, 0.08);
}

.item-mark {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: linear-gradient(160deg, #f6ede0, #ede1d2);
  color: #6b1520;
  font-family: 'Georgia', serif;
  font-size: 18px;
}

.item-copy {
  display: grid;
  gap: 4px;
}

.item-copy strong {
  color: #12100f;
  font-size: 14px;
  line-height: 1.4;
}

.item-price {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.item-price span {
  color: #5a514c;
  font-size: 13px;
}

.item-price .item-price-old {
  color: #9a8d86;
  text-decoration: line-through;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-actions button,
.item-actions span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 999px;
}

.item-actions button {
  border: 0;
  background: #12100f;
  color: #faf7f2;
}

.item-actions button:disabled {
  background: #bcaeb1;
}

.item-actions span {
  background: rgba(18, 16, 15, 0.06);
  color: #12100f;
  font-weight: 700;
}

.drawer-footer {
  display: grid;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(18, 16, 15, 0.08);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: #5a514c;
}

.summary-row strong {
  color: #12100f;
}

.summary-row.total {
  color: #12100f;
  font-size: 18px;
}

.summary-row.total strong {
  font-family: 'Georgia', serif;
  font-size: 26px;
  letter-spacing: -0.05em;
}

.checkout-note {
  margin: 0;
  color: #5a514c;
  font-size: 13px;
  line-height: 1.6;
}
</style>
