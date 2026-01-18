<template>
  <section class="fade-in">
    <div class="page-head">
      <div>
        <h1 class="title">Pagos</h1>
        <p class="muted">Confirma o rechaza pagos por transferencia.</p>
      </div>
    </div>
  </section>

  <section class="card fade-in">
    <table class="table">
      <thead>
        <tr>
          <th>Referencia</th>
          <th>Orden</th>
          <th>Monto</th>
          <th>Status</th>
          <th>Fecha</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="intent in intents" :key="intent.id">
          <td>{{ intent.referenceCode || intent.id.slice(0, 8) }}</td>
          <td>{{ intent.orderId.slice(0, 8) }}</td>
          <td>{{ formatAmount(intent) }}</td>
          <td><span class="pill">{{ intent.status }}</span></td>
          <td>{{ formatDate(intent.createdAt) }}</td>
          <td class="actions">
            <button
              v-if="canReview(intent.status)"
              class="btn btn-primary"
              type="button"
              @click="confirm(intent.id)"
            >
              Confirmar
            </button>
            <button
              v-if="canReview(intent.status)"
              class="btn btn-ghost"
              type="button"
              @click="reject(intent.id)"
            >
              Rechazar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import type { PaymentIntent } from '~/types';

definePageMeta({ middleware: 'auth' });

const config = useRuntimeConfig();
const { authHeaders, hydrate } = useAuth();
hydrate();

const apiHeaders = computed(() => ({
  ...authHeaders.value,
  'x-store-slug': config.public.storeSlug,
}));

const { data, refresh } = await useFetch<PaymentIntent[]>('/admin/payments', {
  baseURL: config.public.apiUrl,
  server: false,
  headers: apiHeaders,
});

const intents = computed(() => data.value ?? []);

const canReview = (status: string) => ['pending', 'submitted'].includes(status);

const confirm = async (intentId: string) => {
  await $fetch(`/admin/payments/${intentId}/confirm`, {
    baseURL: config.public.apiUrl,
    method: 'POST',
    headers: apiHeaders.value,
  });
  await refresh();
};

const reject = async (intentId: string) => {
  await $fetch(`/admin/payments/${intentId}/reject`, {
    baseURL: config.public.apiUrl,
    method: 'POST',
    headers: apiHeaders.value,
  });
  await refresh();
};

const formatAmount = (intent: PaymentIntent) =>
  `${intent.currency} ${Number(intent.amount).toFixed(2)}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 18px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid var(--outline);
}

.actions {
  display: flex;
  gap: 8px;
}
</style>
