<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useStorefrontAuthStore } from '../../stores/storefrontAuth'
import { useStorefrontCartStore } from '../../stores/storefrontCart'
import { useStorefrontCheckoutStore } from '../../stores/storefrontCheckout'
import { useStorefrontPaymentsStore } from '../../stores/storefrontPayments'
import { useStorefrontUiStore } from '../../stores/storefrontUi'

const authStore = useStorefrontAuthStore()
const cartStore = useStorefrontCartStore()
const checkoutStore = useStorefrontCheckoutStore()
const paymentsStore = useStorefrontPaymentsStore()
const uiStore = useStorefrontUiStore()

const { checkoutModalOpen } = storeToRefs(uiStore)
const { cart, cartItems, subtotal, shipping, total } = storeToRefs(cartStore)
const { checkoutResult, loading: checkoutLoading, error: checkoutError } = storeToRefs(checkoutStore)
const { paymentMethods, loadingMethods } = storeToRefs(paymentsStore)

const step = ref(1)
const personalForm = reactive({
  name: '',
  documentId: '',
  phone: '',
  birthDate: '',
})
const deliveryForm = reactive({
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  country: 'Colombia',
})
const paymentMethod = ref('bank_transfer')
const profileError = ref('')
const completedOrder = ref(null)

const profileIsComplete = computed(() =>
  Boolean(authStore.customer?.isCheckoutProfileComplete),
)

watch(checkoutModalOpen, async (isOpen) => {
  if (!isOpen) return

  authStore.restoreSession()
  checkoutStore.resetCheckout()
  completedOrder.value = null
  profileError.value = ''
  step.value = 1
  fillPersonalForm()

  const methods = await paymentsStore.loadPaymentMethods()
  paymentMethod.value = methods[0]?.type || 'bank_transfer'
})

function fillPersonalForm() {
  personalForm.name = authStore.customer?.fullName || authStore.user?.name || ''
  personalForm.documentId = authStore.customer?.documentId || ''
  personalForm.phone = authStore.customer?.phone || authStore.user?.phone || ''
  personalForm.birthDate = authStore.customer?.birthDate || ''
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function close() {
  uiStore.closeCheckoutModal()
}

function returnToCart() {
  uiStore.closeCheckoutModal()
  uiStore.openCart()
}

async function continueFromPersonalData() {
  profileError.value = ''
  if (profileIsComplete.value) {
    step.value = 2
    return
  }

  const response = await authStore.completeAgeProfile({
    name: personalForm.name || undefined,
    documentId: personalForm.documentId,
    phone: personalForm.phone || undefined,
    birthDate: personalForm.birthDate,
  })
  if (!response) {
    profileError.value = authStore.error || 'No fue posible guardar tus datos personales.'
    return
  }
  step.value = 2
}

function continueFromDelivery() {
  step.value = 3
}

async function confirmOrder() {
  if (!cart.value?.id) return

  const response = await checkoutStore.confirmCheckout({
    cartId: cart.value.id,
    shippingAddress: { ...deliveryForm },
    billingAddress: { ...deliveryForm },
    paymentMethod: paymentMethod.value,
  })
  if (!response) return

  completedOrder.value = response.order
  cartStore.resetCart()
}
</script>

<template>
  <div v-if="checkoutModalOpen" class="checkout-layer" role="presentation" @click.self="close">
    <section class="checkout-modal" role="dialog" aria-modal="true" aria-label="Finalizar compra">
      <button class="checkout-close" type="button" aria-label="Cerrar checkout" @click="close">×</button>

      <div v-if="completedOrder" class="checkout-success">
        <span class="success-mark">✓</span>
        <h2>Pedido creado</h2>
        <p>Tu pedido #{{ completedOrder.orderNumber }} quedó registrado. Sigue las instrucciones de pago para completarlo.</p>
        <button class="primary-button" type="button" @click="close">Cerrar</button>
      </div>

      <template v-else>
        <header class="checkout-progress" aria-label="Progreso de compra">
          <div :class="{ active: step >= 1 }"><span>1</span><strong>Datos personales</strong></div>
          <i :class="{ active: step >= 2 }" />
          <div :class="{ active: step >= 2 }"><span>2</span><strong>Datos de entrega</strong></div>
          <i :class="{ active: step >= 3 }" />
          <div :class="{ active: step >= 3 }"><span>3</span><strong>Pago</strong></div>
        </header>

        <div class="checkout-content">
          <main class="checkout-main">
            <button class="back-link" type="button" @click="returnToCart">← Volver al carrito</button>

            <form v-if="step === 1" class="checkout-card" @submit.prevent="continueFromPersonalData">
              <h2>Datos de facturación</h2>
              <p class="account-email">Correo: <strong>{{ authStore.user?.email }}</strong></p>
              <p v-if="!profileIsComplete" class="checkout-alert">
                Completa fecha de nacimiento y cédula para continuar con una compra de licor.
              </p>
              <p v-if="profileError" class="form-error">{{ profileError }}</p>
              <div class="field-grid">
                <label>Nombre completo
                  <input v-model.trim="personalForm.name" required placeholder="Nombre y apellidos" />
                </label>
                <label>Cédula de ciudadanía
                  <input v-model.trim="personalForm.documentId" inputmode="numeric" required placeholder="Número de documento" />
                </label>
                <label>Teléfono / móvil
                  <input v-model.trim="personalForm.phone" autocomplete="tel" required placeholder="300 000 0000" />
                </label>
                <label>Fecha de nacimiento
                  <input v-model="personalForm.birthDate" type="date" required />
                </label>
              </div>
              <button class="primary-button" :disabled="authStore.loading" type="submit">
                {{ authStore.loading ? 'Guardando…' : 'Continuar con entrega' }}
              </button>
            </form>

            <form v-else-if="step === 2" class="checkout-card" @submit.prevent="continueFromDelivery">
              <h2>Datos de entrega</h2>
              <div class="field-grid">
                <label class="field-wide">Dirección
                  <input v-model.trim="deliveryForm.address1" required placeholder="Calle, carrera y número" />
                </label>
                <label>Complemento <small>(opcional)</small>
                  <input v-model.trim="deliveryForm.address2" placeholder="Apartamento, torre, etc." />
                </label>
                <label>Ciudad
                  <input v-model.trim="deliveryForm.city" required placeholder="Bogotá" />
                </label>
                <label>Departamento
                  <input v-model.trim="deliveryForm.state" required placeholder="Cundinamarca" />
                </label>
                <label>Código postal
                  <input v-model.trim="deliveryForm.zip" required placeholder="110111" />
                </label>
                <label>País
                  <input v-model.trim="deliveryForm.country" required />
                </label>
              </div>
              <div class="checkout-actions">
                <button class="secondary-button" type="button" @click="step = 1">Atrás</button>
                <button class="primary-button" type="submit">Continuar al pago</button>
              </div>
            </form>

            <section v-else class="checkout-card">
              <h2>Pago</h2>
              <p>Selecciona cómo deseas pagar. El pedido se crea al confirmar.</p>
              <label class="payment-select">Método de pago
                <select v-model="paymentMethod" :disabled="loadingMethods">
                  <option v-for="method in paymentMethods" :key="method.id" :value="method.type">
                    {{ method.type.replaceAll('_', ' ') }}
                  </option>
                  <option v-if="!paymentMethods.length" value="bank_transfer">Transferencia bancaria</option>
                </select>
              </label>
              <p v-if="checkoutError" class="form-error">{{ checkoutError }}</p>
              <div class="checkout-actions">
                <button class="secondary-button" type="button" @click="step = 2">Atrás</button>
                <button class="primary-button" :disabled="checkoutLoading" type="button" @click="confirmOrder">
                  {{ checkoutLoading ? 'Creando pedido…' : 'Confirmar pedido' }}
                </button>
              </div>
            </section>
          </main>

          <aside class="checkout-summary">
            <h2>Resumen de la compra</h2>
            <article v-for="item in cartItems" :key="item.id" class="summary-product">
              <div class="summary-image">
                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" />
                <span v-else>LC</span>
              </div>
              <div>
                <strong>{{ item.title }}</strong>
                <span>{{ item.quantity }} {{ item.quantity === 1 ? 'unidad' : 'unidades' }}</span>
                <b>{{ formatCurrency(item.unitPrice * item.quantity) }}</b>
              </div>
            </article>
            <div class="summary-line"><span>Subtotal</span><strong>{{ formatCurrency(subtotal) }}</strong></div>
            <div class="summary-line"><span>Gastos de envío</span><strong>{{ shipping ? formatCurrency(shipping) : 'Gratis' }}</strong></div>
            <div class="summary-line summary-total"><span>Total</span><strong>{{ formatCurrency(total) }}</strong></div>
          </aside>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.checkout-layer { position: fixed; inset: 0; z-index: 180; display: grid; place-items: center; padding: 24px; background: rgba(14, 12, 11, .66); }
.checkout-modal { width: min(1180px, 100%); max-height: min(94dvh, 850px); overflow: auto; position: relative; background: #fff; color: #12100f; box-shadow: 0 30px 80px rgba(0,0,0,.3); }
.checkout-close { position: absolute; top: 14px; right: 16px; z-index: 1; width: 38px; height: 38px; border: 0; border-radius: 50%; background: #efefef; color: #35312e; font-size: 30px; line-height: 1; }
.checkout-progress { display: flex; align-items: flex-start; justify-content: center; gap: 10px; padding: 23px 74px; border-bottom: 1px solid #f0eeee; }
.checkout-progress div { display: grid; justify-items: center; gap: 7px; min-width: 130px; color: #8e9093; font-size: 12px; font-weight: 800; }
.checkout-progress span { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 50%; background: #eff0f1; }
.checkout-progress div.active { color: #12100f; }
.checkout-progress div.active span { background: #bef747; }
.checkout-progress i { width: min(135px, 15vw); height: 3px; margin-top: 15px; background: #ececec; }
.checkout-progress i.active { background: #bef747; }
.checkout-content { display: grid; grid-template-columns: minmax(0, 1.32fr) minmax(290px, .78fr); gap: 42px; padding: 42px 58px 58px; }
.checkout-main { min-width: 0; }
.back-link { border: 0; background: transparent; color: #e86c00; font-weight: 800; text-decoration: underline; }
.checkout-card { display: grid; gap: 20px; margin-top: 17px; padding: 28px; border: 1px solid #dedbd8; border-radius: 18px; }
.checkout-card h2, .checkout-summary h2 { margin: 0; font-size: 18px; letter-spacing: .04em; text-transform: uppercase; }
.checkout-card > p { margin: 0; color: #655f5b; line-height: 1.5; }
.account-email { font-size: 14px; }
.checkout-alert { border-radius: 10px; padding: 11px 13px; background: #fff8dc; color: #6a5612 !important; font-size: 13px; }
.field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 17px 12px; }
.field-grid label, .payment-select { display: grid; gap: 7px; color: #77716c; font-size: 13px; }
.field-grid input, .payment-select select { width: 100%; min-height: 46px; border: 1px solid #ccc8c4; border-radius: 999px; padding: 11px 14px; background: #fff; color: #12100f; font: inherit; outline: none; }
.field-grid input:focus, .payment-select select:focus { border-color: #95c92e; box-shadow: 0 0 0 3px rgba(190,247,71,.24); }
.field-wide { grid-column: 1 / -1; }
.field-grid small { font-size: 11px; }
.primary-button, .secondary-button { min-height: 47px; padding: 12px 20px; border-radius: 999px; font: inherit; font-size: 14px; font-weight: 800; }
.primary-button { border: 0; background: #bef747; color: #12100f; }
.primary-button:disabled { opacity: .6; cursor: not-allowed; }
.secondary-button { border: 1px solid #d5d0cc; background: #fff; color: #12100f; }
.checkout-actions { display: flex; justify-content: flex-end; gap: 10px; }
.form-error { padding: 10px 12px; border-radius: 10px; background: #fff0f0; color: #a32626 !important; font-size: 13px; }
.checkout-summary { align-self: start; display: grid; gap: 17px; padding-top: 44px; }
.summary-product { display: grid; grid-template-columns: 72px 1fr; gap: 13px; align-items: center; }
.summary-image { width: 72px; height: 72px; display: grid; place-items: center; overflow: hidden; border-radius: 12px; background: #f6f5f4; color: #7b746e; font-weight: 800; }
.summary-image img { width: 100%; height: 100%; object-fit: cover; }
.summary-product div:last-child { display: grid; gap: 2px; font-size: 13px; }
.summary-product strong { line-height: 1.35; }
.summary-product span { color: #7a736d; }
.summary-product b { font-size: 14px; }
.summary-line { display: flex; justify-content: space-between; gap: 18px; color: #37322f; font-size: 14px; }
.summary-total { margin-top: 2px; padding-top: 15px; border-top: 1px solid #dedbd8; color: #12100f; font-size: 20px; font-weight: 800; }
.checkout-success { display: grid; justify-items: center; gap: 14px; padding: 90px 32px; text-align: center; }
.checkout-success h2, .checkout-success p { margin: 0; }
.checkout-success p { max-width: 420px; color: #625c57; line-height: 1.6; }
.success-mark { display: grid; width: 60px; height: 60px; place-items: center; border-radius: 50%; background: #bef747; font-size: 32px; font-weight: 800; }
@media (max-width: 800px) { .checkout-layer { padding: 0; } .checkout-modal { min-height: 100dvh; max-height: 100dvh; } .checkout-progress { padding: 20px 38px; gap: 4px; } .checkout-progress div { min-width: 74px; font-size: 10px; text-align: center; } .checkout-progress i { width: 10vw; } .checkout-content { grid-template-columns: 1fr; gap: 22px; padding: 28px 20px 40px; } .checkout-summary { padding-top: 0; } }
@media (max-width: 480px) { .field-grid { grid-template-columns: 1fr; } .field-wide { grid-column: auto; } .checkout-progress { padding-left: 22px; padding-right: 48px; } .checkout-progress div { min-width: 65px; } .checkout-progress strong { max-width: 70px; } }
</style>
