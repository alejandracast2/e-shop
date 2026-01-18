<template>
  <section class="section">
    <div class="container">
      <div class="eyebrow">Pedidos</div>
      <h1 class="title">Consulta tu orden</h1>
      <p class="subtitle">
        Ingresa tu numero de pedido y el email asociado para ver el estado.
      </p>

      <form class="card form" @submit.prevent="fetchOrder">
        <label>
          Numero de orden
          <input v-model.number="form.orderNumber" type="number" min="1" required />
        </label>
        <label>
          Email (opcional)
          <input v-model="form.email" type="email" />
        </label>
        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Buscando...' : 'Consultar pedido' }}
        </button>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </form>

      <div v-if="order" class="card detail">
        <div>
          <div class="eyebrow">Orden #{{ order.orderNumber }}</div>
          <h2>Estado: {{ order.status }}</h2>
          <p class="muted">Pago: {{ order.paymentStatus }}</p>
        </div>
        <div>
          <p class="total">${{ Number(order.totalAmount).toFixed(2) }}</p>
          <p class="muted">Creada: {{ formatDate(order.createdAt) }}</p>
        </div>
      </div>

      <div v-if="order?.items?.length" class="card items">
        <h3>Items</h3>
        <div v-for="item in order.items" :key="item.id" class="item-row">
          <span>{{ item.titleSnapshot }}</span>
          <span>x{{ item.quantity }}</span>
          <span>${{ Number(item.totalPrice).toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Order } from '~/types';

const config = useRuntimeConfig();
const loading = ref(false);
const errorMessage = ref('');
const order = ref<Order | null>(null);

const form = reactive({
  orderNumber: undefined as number | undefined,
  email: '',
});

const fetchOrder = async () => {
  errorMessage.value = '';
  order.value = null;
  if (!form.orderNumber) return;
  loading.value = true;
  try {
    const response = await $fetch<Order>(
      `/storefront/orders/${form.orderNumber}`,
      {
        baseURL: config.public.apiUrl,
        headers: {
          'x-store-slug': config.public.storeSlug,
        },
        query: form.email ? { email: form.email } : undefined,
      },
    );
    order.value = response;
  } catch (error) {
    errorMessage.value = 'No se encontro la orden.';
  } finally {
    loading.value = false;
  }
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
</script>

<style scoped>
.form {
  display: grid;
  gap: 16px;
  max-width: 520px;
  margin-top: 24px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

input {
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 10px 12px;
  font-family: inherit;
}

.error {
  color: var(--accent-strong);
  margin: 0;
}

.detail {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}

.total {
  font-size: 22px;
  font-weight: 700;
}

.items {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid var(--outline);
  padding-bottom: 8px;
}
</style>
