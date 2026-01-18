<template>
  <section class="section">
    <div class="container">
      <div class="eyebrow">Checkout</div>
      <h1 class="title">Ultimo paso</h1>
      <p class="subtitle">
        Completa tus datos y envia tu pedido. Recibiras confirmacion al instante.
      </p>

      <div v-if="checkoutResult" class="success card">
        <h2>Pedido confirmado</h2>
        <p>
          Gracias por tu compra. Tu numero de orden es
          #{{ checkoutResult.order.orderNumber }}.
        </p>
        <div class="payment-box">
          <h3>Pago por transferencia</h3>
          <p v-if="checkoutResult.paymentIntent.referenceCode">
            Referencia:
            <strong>{{ checkoutResult.paymentIntent.referenceCode }}</strong>
          </p>
          <div v-if="bankInfo" class="bank-info">
            <p v-if="bankInfo.bank">Banco: {{ bankInfo.bank }}</p>
            <p v-if="bankInfo.accountName">Titular: {{ bankInfo.accountName }}</p>
            <p v-if="bankInfo.accountNumber">Cuenta: {{ bankInfo.accountNumber }}</p>
            <p v-if="bankInfo.instructions">{{ bankInfo.instructions }}</p>
          </div>
          <p class="muted">
            Cuando completes la transferencia, el administrador confirmara tu pago.
          </p>
        </div>
        <NuxtLink class="btn btn-primary" to="/">Seguir comprando</NuxtLink>
      </div>

      <div v-else class="checkout-grid">
        <form class="card form" @submit.prevent="submitOrder">
          <h3>Datos del cliente</h3>
          <div class="form-grid">
            <label class="full">
              Nombre completo
              <input v-model="form.fullName" required />
            </label>
            <label>
              Email
              <input v-model="form.email" type="email" />
            </label>
            <label>
              Telefono
              <input v-model="form.phone" />
            </label>
          </div>

          <h3>Direccion de envio</h3>
          <div class="form-grid">
            <label class="full">
              Direccion
              <input v-model="form.address1" required />
            </label>
            <label class="full">
              Departamento o referencia
              <input v-model="form.address2" />
            </label>
            <label>
              Ciudad
              <input v-model="form.city" required />
            </label>
            <label>
              Estado
              <input v-model="form.state" required />
            </label>
            <label>
              Codigo postal
              <input v-model="form.zip" required />
            </label>
            <label>
              Pais
              <input v-model="form.country" required />
            </label>
          </div>

          <label class="full">
            Notas para el pedido
            <textarea v-model="form.notes" rows="3" />
          </label>

          <button class="btn btn-primary" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Enviando...' : 'Confirmar pedido' }}
          </button>
          <p v-if="submitError" class="error">{{ submitError }}</p>
        </form>

        <CartSummary :items="items" :total="total" />
      </div>

      <div v-if="!items.length && !checkoutResult" class="empty card">
        <p>No hay productos en el carrito.</p>
        <NuxtLink class="btn btn-primary" to="/">Explorar productos</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CheckoutResponse } from '~/types';

const { items, total, clear } = useCart();
const config = useRuntimeConfig();
const isSubmitting = ref(false);
const checkoutResult = ref<CheckoutResponse | null>(null);
const submitError = ref('');

const form = reactive({
  fullName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  notes: '',
});

const bankInfo = computed(() => {
  const configJson = checkoutResult.value?.paymentMethod?.configJson;
  return configJson && typeof configJson === 'object' ? configJson : null;
});

const submitOrder = async () => {
  submitError.value = '';
  if (!items.value.length) return;
  isSubmitting.value = true;
  try {
    const cart = await $fetch<{ id: string }>('/storefront/cart', {
      baseURL: config.public.apiUrl,
      method: 'POST',
      headers: {
        'x-store-slug': config.public.storeSlug,
      },
      body: {
        items: items.value.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      },
    });

    const response = await $fetch<CheckoutResponse>('/storefront/checkout/confirm', {
      baseURL: config.public.apiUrl,
      method: 'POST',
      headers: {
        'x-store-slug': config.public.storeSlug,
      },
      body: {
        cartId: cart.id,
        customer: {
          fullName: form.fullName,
          email: form.email || undefined,
          phone: form.phone || undefined,
        },
        shippingAddress: {
          address1: form.address1,
          address2: form.address2 || undefined,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        },
        notes: form.notes || undefined,
        paymentMethod: 'bank_transfer',
      },
    });

    checkoutResult.value = response;
    clear();
  } catch (error) {
    submitError.value = 'No se pudo enviar el pedido. Intenta de nuevo.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.checkout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 24px;
  margin-top: 32px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form h3 {
  margin: 0;
  font-size: 18px;
}

.form-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

label.full {
  grid-column: 1 / -1;
}

input,
textarea {
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 10px 12px;
  font-family: inherit;
}

.success {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-box {
  background: var(--surface);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bank-info p {
  margin: 0;
}

.error {
  color: var(--accent-strong);
  margin: 0;
}

.empty {
  margin-top: 24px;
}

@media (max-width: 900px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
