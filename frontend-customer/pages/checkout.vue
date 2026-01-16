<template>
  <section class="section">
    <div class="container">
      <div class="eyebrow">Checkout</div>
      <h1 class="title">Ultimo paso</h1>
      <p class="subtitle">
        Completa tus datos y envia tu pedido. Recibiras confirmacion al instante.
      </p>

      <div v-if="orderId" class="success card">
        <h2>Pedido confirmado</h2>
        <p>Gracias por tu compra. Tu numero de orden es #{{ orderId }}.</p>
        <NuxtLink class="btn btn-primary" to="/">Seguir comprando</NuxtLink>
      </div>

      <div v-else class="checkout-grid">
        <form class="card form" @submit.prevent="submitOrder">
          <h3>Datos del cliente</h3>
          <div class="form-grid">
            <label>
              Nombre
              <input v-model="form.firstName" required />
            </label>
            <label>
              Apellido
              <input v-model="form.lastName" required />
            </label>
            <label>
              Email
              <input v-model="form.email" type="email" required />
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
              <input v-model="form.addressLine1" required />
            </label>
            <label class="full">
              Departamento o referencia
              <input v-model="form.addressLine2" />
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
              <input v-model="form.postalCode" required />
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

      <div v-if="!items.length && !orderId" class="empty card">
        <p>No hay productos en el carrito.</p>
        <NuxtLink class="btn btn-primary" to="/">Explorar productos</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CustomerInput, OrderItemInput, OrderResponse } from '~/types';

const { items, total, clear } = useCart();
const config = useRuntimeConfig();
const isSubmitting = ref(false);
const orderId = ref<number | null>(null);
const submitError = ref('');

const form = reactive<CustomerInput & { notes?: string }>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  notes: '',
});

const submitOrder = async () => {
  submitError.value = '';
  if (!items.value.length) return;
  isSubmitting.value = true;
  try {
    const orderItems: OrderItemInput[] = items.value.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const payload = {
      customer: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
      },
      items: orderItems,
      notes: form.notes || undefined,
    };

    const response = await $fetch<OrderResponse>('/orders', {
      baseURL: config.public.apiUrl,
      method: 'POST',
      body: payload,
    });

    orderId.value = response.id;
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
