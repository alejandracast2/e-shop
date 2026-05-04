<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useStorefrontCartStore } from '../../stores/storefrontCart'
import { useStorefrontUiStore } from '../../stores/storefrontUi'

const cartStore = useStorefrontCartStore()
const uiStore = useStorefrontUiStore()

const { cartItems, cartCount, subtotal, shipping, total, loading, error } = storeToRefs(cartStore)
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
</script>

<template>
  <div class="drawer-layer" :class="{ visible: cartOpen }" :inert="!cartOpen" :aria-hidden="cartOpen ? null : 'true'">
    <button class="drawer-overlay" type="button" aria-label="Cerrar carrito" @click="uiStore.closeCart" />

    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <header class="drawer-header">
        <div class="drawer-heading">
          <h2 id="cart-drawer-title">Mi carrito</h2>
          <span v-if="cartItems.length" class="drawer-count">
            {{ cartCount }} {{ cartCount === 1 ? 'producto' : 'productos' }}
          </span>
        </div>

        <button class="close-button" type="button" aria-label="Cerrar carrito" @click="uiStore.closeCart">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <p v-if="error" class="drawer-error">{{ error }}</p>

      <div v-if="!cartItems.length" class="drawer-empty">
        <span class="empty-mark">LC</span>
        <h3>Mi carrito esta vacio</h3>
        <p>Agrega productos del catalogo y aqui veras el resumen de tu pedido.</p>
        <button class="empty-action" type="button" @click="uiStore.closeCart">
          Explorar catalogo
        </button>
      </div>

      <div v-else class="drawer-body" role="list">
        <article v-for="item in cartItems" :key="item.id" class="drawer-item" role="listitem">
          <div class="item-image" aria-hidden="true">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" />
            <span v-else>{{ initialsFor(item.title) }}</span>
          </div>
          <div class="item-copy">
            <div class="item-heading">
              <strong>{{ item.title }}</strong>
              <button class="remove-button" type="button" :disabled="loading"
                :aria-label="`Quitar ${item.title} del carrito`" @click="removeItem(item)">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                  <path d="M4 7h16" />
                  <path d="M9 7V4h6v3" />
                  <path d="m6 7 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
            <div class="item-price">
              <span>{{ formatCurrency(item.unitPrice) }}</span>
              <span v-if="item.discountPercent" class="item-price-old">
                {{ formatCurrency(item.baseUnitPrice) }}
              </span>
            </div>

            <div class="item-footer">
              <div class="item-actions" aria-label="Cantidad">
                <button type="button" :disabled="loading"
                  :aria-label="`Restar una unidad de ${item.title}`" @click="changeQuantity(item, item.quantity - 1)">
                  -
                </button>
                <span aria-live="polite">{{ item.quantity }}</span>
                <button type="button" :disabled="loading" :aria-label="`Sumar una unidad de ${item.title}`"
                  @click="changeQuantity(item, item.quantity + 1)">
                  +
                </button>
              </div>

              <strong class="item-total">
                {{ formatCurrency(item.unitPrice * item.quantity) }}
              </strong>
            </div>
          </div>
        </article>
      </div>

      <footer v-if="cartItems.length" class="drawer-footer">
        <div class="summary-row">
          <span>Subtotal</span>
          <strong>{{ formatCurrency(subtotal) }}</strong>
        </div>
        <div class="summary-row">
          <span>Envio estimado</span>
          <strong>{{ shipping ? formatCurrency(shipping) : 'Gratis' }}</strong>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <strong>{{ formatCurrency(total) }}</strong>
        </div>
        <p class="checkout-note">
          Revisa productos y cantidades antes de continuar con la confirmacion del pedido.
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
  color: var(--ink);
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
  color: var(--wine);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.drawer-header h2 {
  margin: 0;
  color: var(--ink);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 0;
}

.drawer-count {
  color: var(--ink-3);
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
  color: var(--ink);
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
  border: 1px solid rgba(21, 61, 107, 0.24);
  border-radius: 8px;
  background: rgba(161, 177, 255, 0.16);
  color: var(--wine-3);
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
  color: var(--ink-3);
}

.empty-mark {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--wine);
  color: var(--bone);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 24px;
  font-weight: 700;
}

.drawer-empty h3 {
  margin: 0;
  color: var(--ink);
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
  color: var(--bone);
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
  color: var(--wine);
  font-family: 'Playfair Display', Georgia, serif;
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
  color: var(--ink);
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
  color: var(--ink-4);
  transition: background 0.15s ease, color 0.15s ease;
}

.remove-button:hover {
  background: var(--bone-4);
  color: var(--wine);
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
  color: var(--ink-3);
  font-size: 13px;
}

.item-price .item-price-old {
  color: var(--ink-4);
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
  color: var(--ink-3);
  font-size: 14px;
  font-weight: 700;
  transition: background 0.15s ease, color 0.15s ease;
}

.item-actions button:last-of-type {
  background: var(--ink);
  color: var(--bone);
}

.item-actions button:hover {
  background: var(--wine);
  color: var(--bone);
}

.item-actions button:disabled {
  background: var(--bone-4);
  color: var(--ink-4);
  cursor: not-allowed;
  opacity: 0.5;
}

.item-actions span {
  background: transparent;
  color: var(--ink);
  font-weight: 700;
}

.item-total {
  color: var(--ink);
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
  color: var(--ink-3);
  font-size: 14px;
}

.summary-row strong {
  color: var(--ink);
}

.summary-row.total {
  margin-top: 2px;
  padding-top: 12px;
  border-top: 1px solid var(--line-2);
  color: var(--ink);
  font-size: 18px;
}

.summary-row.total strong {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0;
}

.checkout-note {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bone-4);
  color: var(--ink-3);
  font-size: 12px;
  line-height: 1.6;
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
</style>
