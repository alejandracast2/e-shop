<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useStorefrontCartStore } from '../../stores/storefrontCart'
import { useStorefrontUiStore } from '../../stores/storefrontUi'
import { useStorefrontAuthStore } from '../../stores/storefrontAuth'

const cartStore = useStorefrontCartStore()
const uiStore = useStorefrontUiStore()
const authStore = useStorefrontAuthStore()

const { cartItems, cartCount, subtotal, shipping, total, loading, error } = storeToRefs(cartStore)
const { cartOpen } = storeToRefs(uiStore)

const FREE_SHIPPING_THRESHOLD = 180000
const shippingProgress = computed(() =>
  Math.min((Number(subtotal.value || 0) / FREE_SHIPPING_THRESHOLD) * 100, 100),
)
const remainingForFreeShipping = computed(() =>
  Math.max(FREE_SHIPPING_THRESHOLD - Number(subtotal.value || 0), 0),
)

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
  if(quantity==0){
    removeItem(item)
  }
}

async function removeItem(item) {
  await cartStore.removeCartItem(item)

  if (!error.value) {
    uiStore.showToast(`${item.title} fue retirado de tu carrito.`)
  }
}

function beginCheckout() {
  if (!authStore.isAuthenticated) {
    uiStore.closeCart()
    uiStore.openAccountModal()
    uiStore.showToast('Inicia sesión para finalizar tu compra.')
    return
  }

  uiStore.closeCart()
  uiStore.openCheckoutModal()
}
</script>

<template>
  <div class="drawer-layer" :class="{ visible: cartOpen }" :inert="!cartOpen" :aria-hidden="cartOpen ? null : 'true'">
    <button class="drawer-overlay" type="button" aria-label="Cerrar carrito" @click="uiStore.closeCart" />

    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <header class="drawer-header">
        <div class="drawer-heading">
          <h2 id="cart-drawer-title">Mi carrito ({{ cartCount }})</h2>
        </div>

        <button class="close-button" type="button" aria-label="Cerrar carrito" @click="uiStore.closeCart">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <p v-if="error" class="drawer-error">{{ error }}</p>

      <section v-if="cartItems.length" class="shipping-progress" aria-live="polite">
        <div class="shipping-progress__message">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 6h11v10H3zM14 9h3.6L21 12.5V16h-7z" />
            <path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          </svg>
          <p v-if="remainingForFreeShipping">
            Te faltan <strong>{{ formatCurrency(remainingForFreeShipping) }}</strong> para obtener envío gratis
          </p>
          <p v-else>Tu pedido tiene <strong>envío gratis</strong></p>
        </div>
        <div class="shipping-progress__track" role="progressbar" aria-label="Progreso para envío gratis"
          aria-valuemin="0" :aria-valuenow="shippingProgress" aria-valuemax="100">
          <span :style="{ width: `${shippingProgress}%` }" />
        </div>
        <div class="shipping-progress__values">
          <strong>{{ formatCurrency(subtotal) }}</strong>
          <span>{{ formatCurrency(FREE_SHIPPING_THRESHOLD) }}</span>
        </div>
      </section>

      <div v-if="!cartItems.length" class="drawer-empty">
        <span class="empty-mark">LC</span>
        <h3>Mi carrito está vacío</h3>
        <p>Agrega productos del catálogo y aquí verás el resumen de tu pedido.</p>
        <button class="empty-action" type="button" @click="uiStore.closeCart">
          Explorar catálogo
        </button>
      </div>

      <div v-else class="drawer-body" role="list">
        <article v-for="item in cartItems" :key="item.id" class="drawer-item" role="listitem">
          <div class="item-image" aria-hidden="true">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" />
            <span v-else>{{ initialsFor(item.title) }}</span>
          </div>
          <div class="item-copy">
            <strong class="item-name">{{ item.title }}</strong>
            <span class="item-detail">Precio por unidad</span>
          </div>
          <div class="item-pricing">
            <strong class="item-total">{{ formatCurrency(item.unitPrice) }}</strong>
            <span v-if="item.discountPercent" class="item-price-old">
              {{ formatCurrency(item.baseUnitPrice) }}
            </span>
          </div>
          <div class="item-actions" aria-label="Cantidad">
            <button type="button" :disabled="loading"
              :aria-label="`Restar una unidad de ${item.title}`" @click="changeQuantity(item, item.quantity - 1)">
              −
            </button>
            <span aria-live="polite">{{ item.quantity }}</span>
            <button type="button" :disabled="loading" :aria-label="`Sumar una unidad de ${item.title}`"
              @click="changeQuantity(item, item.quantity + 1)">
              +
            </button>
          </div>
          <button class="remove-button" type="button" :disabled="loading"
            :aria-label="`Quitar ${item.title} del carrito`" @click="removeItem(item)">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
              <path d="M4 7h16" />
              <path d="M9 7V4h6v3" />
              <path d="m6 7 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </article>
      </div>

      <footer v-if="cartItems.length" class="drawer-footer">
        <h3>Resumen del pedido</h3>
        <div class="summary-row">
          <span>Subtotal ({{ cartCount }} {{ cartCount === 1 ? 'producto' : 'productos' }})</span>
          <strong>{{ formatCurrency(subtotal) }}</strong>
        </div>
        <div class="summary-row">
          <span>Envío</span>
          <strong :class="{ 'is-free': !shipping }">{{ shipping ? formatCurrency(shipping) : 'Gratis' }}</strong>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <strong>{{ formatCurrency(total) }}</strong>
        </div>
        <button class="checkout-action" type="button" @click="beginCheckout">
          Finalizar compra
        </button>
        <button class="view-cart-action" type="button" @click="uiStore.closeCart">
          Ver carrito
        </button>
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
  background: rgba(18, 16, 15, 0.58);
  cursor: default;
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
  width: min(420px, 100vw);
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bone);
  border-left: 1px solid var(--line);
  box-shadow: -18px 0 48px rgba(18, 16, 15, 0.18);
  color: var(--text-primary);
  transform: translateX(100%);
  transition: transform 0.22s ease;
}

.drawer-layer.visible .drawer {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 24px 18px;
  border-bottom: 1px solid var(--line-2);
}

.drawer-heading {
  display: grid;
  gap: 5px;
}

.drawer-kicker {
  margin: 0;
  color: var(--text-brand);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.drawer-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 0;
}

.drawer-count {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.close-button {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--text-primary);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.close-button:hover {
  background: var(--bone-4);
  border-color: var(--line);
}

.close-button svg {
  width: 16px;
  height: 16px;
}

.drawer-error {
  margin: 14px 24px 0;
  padding: 11px 12px;
  border: 1px solid rgba(179, 38, 30, 0.24);
  border-radius: 8px;
  background: rgba(243, 230, 232, 0.72);
  color: var(--text-brand-dark);
  font-size: 13px;
  line-height: 1.4;
}

.drawer-empty {
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  gap: 12px;
  padding: 28px 24px;
  color: var(--text-secondary);
}

.empty-mark {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--wine);
  color: var(--text-on-dark);
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
}

.drawer-empty h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
}

.drawer-empty p {
  margin: 0;
  max-width: 28ch;
  line-height: 1.7;
}

.empty-action {
  margin-top: 6px;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--text-on-dark);
  font-size: 13px;
  font-weight: 700;
}

.drawer-body {
  flex: 1;
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 10px;
  overflow: auto;
  padding: 18px;
  scrollbar-width: thin;
  scrollbar-color: var(--ink-4) transparent;
}

.drawer-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 12px;
  border-radius: 8px;
  background: var(--white);
  border: 1px solid var(--line-2);
  box-shadow: 0 1px 2px rgba(18, 16, 15, 0.04);
}

.item-image {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bone-4);
  color: var(--text-brand);
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
}

.item-image img {
  width: 100%;
  height: 100%;
  padding: 4px;
  object-fit: contain;
}

.item-copy {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.item-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px;
  gap: 8px;
  align-items: start;
}

.item-copy strong {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.remove-button {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--text-secondary);
  transition: background 0.15s ease, color 0.15s ease;
}

.remove-button:hover {
  background: var(--bone-4);
  color: var(--text-brand);
}

.remove-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.remove-button svg {
  width: 16px;
  height: 16px;
}

.item-price {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.item-price span {
  color: var(--text-secondary);
  font-size: 13px;
}

.item-price .item-price-old {
  color: var(--text-secondary);
  text-decoration: line-through;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
}

.item-actions button,
.item-actions span {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
}

.item-actions button {
  border: 0;
  background: var(--bone-4);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 700;
  transition: background 0.15s ease, color 0.15s ease;
}

.item-actions button:last-of-type {
  background: var(--ink);
  color: var(--text-on-dark);
}

.item-actions button:hover {
  background: var(--wine);
  color: var(--text-on-dark);
}

.item-actions button:disabled {
  background: var(--bone-4);
  color: var(--text-secondary);
  cursor: not-allowed;
  opacity: 0.5;
}

.item-actions span {
  background: transparent;
  color: var(--text-primary);
  font-weight: 700;
}

.item-total {
  color: var(--text-primary);
  font-size: 14px;
  white-space: nowrap;
}

.drawer-footer {
  display: grid;
  gap: 12px;
  padding: 16px 24px 22px;
  border-top: 1px solid var(--line);
  background: var(--bone);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.summary-row strong {
  color: var(--text-primary);
}

.summary-row.total {
  margin-top: 2px;
  padding-top: 12px;
  border-top: 1px solid var(--line-2);
  color: var(--text-primary);
  font-size: 18px;
}

.summary-row.total strong {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0;
}

.checkout-note {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bone-4);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.checkout-action {
  min-height: 48px;
  border: 0;
  border-radius: 999px;
  background: var(--wine);
  color: var(--text-on-dark);
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.drawer-overlay:focus-visible,
.close-button:focus-visible,
.empty-action:focus-visible,
.remove-button:focus-visible,
.item-actions button:focus-visible {
  outline: 2px solid var(--soft);
  outline-offset: 2px;
}

@media (max-width: 520px) {
  .drawer {
    width: 100vw;
  }

  .drawer-header {
    padding: 20px 18px 16px;
  }

  .drawer-header h2 {
    font-size: 26px;
  }

  .drawer-error {
    margin: 12px 18px 0;
  }

  .drawer-body {
    padding: 14px;
  }

  .drawer-item {
    grid-template-columns: 44px minmax(0, 1fr);
    padding: 10px;
  }

  .item-image {
    width: 44px;
    height: 44px;
  }

  .item-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .drawer-footer {
    padding: 14px 18px 18px;
  }
}

@media (prefers-reduced-motion: reduce) {

  .drawer,
  .drawer-overlay {
    transition: none;
  }
}

/* Cart visual refresh */
.drawer {
  width: min(400px, 100vw);
  background: #fff;
  border-left: 1px solid #ece9e7;
  box-shadow: -18px 0 48px rgba(26, 20, 17, 0.16);
}

.drawer-header {
  align-items: center;
  padding: 26px 26px 18px;
  border-bottom: 0;
}

.drawer-header h2 {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.035em;
}

.close-button {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 6px;
  background: transparent;
}

.close-button:hover {
  border-color: transparent;
  background: #f7f5f4;
}

.close-button svg {
  width: 19px;
  height: 19px;
}

.drawer-error {
  margin: 0 26px 12px;
  border-radius: 6px;
}

.shipping-progress {
  display: grid;
  gap: 10px;
  margin: 4px 26px 13px;
  padding: 18px;
  border-radius: 9px;
  background: #fdf8f6;
}

.shipping-progress__message {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #403b38;
}

.shipping-progress__message svg {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
}

.shipping-progress__message p {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
}

.shipping-progress__message strong,
.shipping-progress__values strong {
  color: var(--wine);
}

.shipping-progress__track {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #e8e3e1;
}

.shipping-progress__track span {
  display: block;
  height: 100%;
  min-width: 3px;
  border-radius: inherit;
  background: var(--wine);
  transition: width 0.2s ease;
}

.shipping-progress__values {
  display: flex;
  justify-content: space-between;
  color: #5d5652;
  font-size: 10px;
  font-weight: 700;
}

.drawer-empty {
  padding: 28px 26px;
}

.empty-mark {
  width: 64px;
  height: 64px;
  background: var(--wine);
}

.empty-action {
  border-radius: 6px;
  background: var(--wine);
}

.drawer-body {
  gap: 0;
  padding: 8px 26px 18px;
  scrollbar-color: #d6d0cd transparent;
}

.drawer-item {
  grid-template-columns: 52px minmax(0, 1fr) auto;
  grid-template-areas:
    'image copy pricing'
    'image quantity remove';
  column-gap: 13px;
  row-gap: 8px;
  align-items: start;
  padding: 20px 0;
  border: 0;
  border-radius: 0;
  border-bottom: 1px solid #f0eeec;
  background: transparent;
  box-shadow: none;
}

.drawer-item:last-child {
  border-bottom: 0;
}

.item-image {
  grid-area: image;
  width: 52px;
  height: 72px;
  border-radius: 4px;
  background: #faf8f7;
}

.item-image img {
  height: 100%;
  padding: 0;
  object-fit: contain;
}

.item-copy {
  grid-area: copy;
  align-content: start;
  gap: 4px;
  padding-top: 1px;
}

.item-copy .item-name {
  color: #28221f;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
}

.item-detail {
  color: #766e69;
  font-size: 11px;
  line-height: 1.4;
}

.item-pricing {
  grid-area: pricing;
  display: grid;
  justify-items: end;
  gap: 2px;
  padding-top: 1px;
}

.item-total {
  color: #1f1b19;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.item-price-old {
  color: #958d89;
  font-size: 10px;
  text-decoration: line-through;
}

.item-actions {
  grid-area: quantity;
  width: fit-content;
  gap: 0;
  padding: 0;
  border-color: #e2deda;
  border-radius: 9px;
}

.item-actions button,
.item-actions span {
  width: 29px;
  height: 34px;
  border-radius: 7px;
}

.item-actions button,
.item-actions button:last-of-type {
  background: transparent;
  color: #433c38;
  font-size: 17px;
  font-weight: 500;
}

.item-actions button:hover,
.item-actions button:last-of-type:hover {
  background: #f7f2f0;
  color: var(--wine);
}

.item-actions span {
  width: 27px;
  color: #292321;
  font-size: 12px;
  font-weight: 800;
}

.remove-button {
  grid-area: remove;
  align-self: center;
  width: 28px;
  height: 34px;
  border-radius: 6px;
  color: #514a46;
}

.remove-button:hover {
  background: #f9eeee;
  color: var(--wine);
}

.remove-button svg {
  width: 15px;
  height: 15px;
}

.drawer-footer {
  gap: 13px;
  padding: 22px 26px 26px;
  border-top: 1px solid #e8e5e3;
  background: #fff;
}

.drawer-footer h3 {
  margin: 0 0 1px;
  color: #2e2926;
  font-size: 13px;
  font-weight: 800;
}

.summary-row {
  color: #655d58;
  font-size: 12px;
}

.summary-row strong {
  color: #332d2a;
  font-size: 12px;
}

.summary-row strong.is-free {
  color: #237a3d;
}

.summary-row.total {
  margin-top: 4px;
  padding-top: 15px;
  border-top-color: #ebe8e6;
  color: #241f1c;
  font-size: 16px;
  font-weight: 800;
}

.summary-row.total strong {
  font-family: var(--font-sans);
  font-size: 17px;
  font-weight: 800;
}

.checkout-action,
.view-cart-action {
  min-height: 47px;
  border-radius: 6px;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: none;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.checkout-action {
  margin-top: 4px;
  background: var(--wine);
  color: #fff;
}

.checkout-action:hover {
  background: var(--wine-2);
}

.view-cart-action {
  border: 1px solid var(--wine);
  background: #fff;
  color: var(--wine);
}

.view-cart-action:hover {
  background: #fff6f5;
}

.drawer-overlay:focus-visible,
.close-button:focus-visible,
.empty-action:focus-visible,
.remove-button:focus-visible,
.item-actions button:focus-visible,
.checkout-action:focus-visible,
.view-cart-action:focus-visible {
  outline: 2px solid var(--soft);
  outline-offset: 2px;
}

@media (max-width: 520px) {
  .drawer-header {
    padding: 22px 20px 16px;
  }

  .shipping-progress {
    margin: 2px 20px 10px;
  }

  .drawer-error {
    margin-right: 20px;
    margin-left: 20px;
  }

  .drawer-body {
    padding-right: 20px;
    padding-left: 20px;
  }

  .drawer-item {
    grid-template-columns: 48px minmax(0, 1fr) auto;
    column-gap: 11px;
  }

  .item-image {
    width: 48px;
    height: 68px;
  }

  .drawer-footer {
    padding: 20px;
  }
}
</style>
