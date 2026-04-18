<script setup>
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { formatAmountWithCurrency, formatDateTime, shortId } from '@/utils/formatters'
import { toErrorMessage } from '@/lib/api'

const auth = useAuthStore()
const admin = useAdminStore()

const loading = ref(false)
const errorMessage = ref('')
const actionLoadingId = ref('')
const intents = ref([])

const loadPayments = async () => {
  if (!auth.isAuthenticated) return

  loading.value = true
  errorMessage.value = ''

  try {
    const payload = await admin.authorizedRequest('/admin/payments')
    intents.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudieron cargar los pagos.')
  } finally {
    loading.value = false
  }
}

watch(
  () => admin.requestScopeKey,
  () => {
    void loadPayments()
  },
  { immediate: true },
)

const canReview = computed(() => auth.canModeratePayments)
const sortedIntents = computed(() =>
  [...intents.value].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
)

const reviewableStatuses = new Set(['pending', 'submitted'])

const confirmPayment = async (intentId) => {
  actionLoadingId.value = intentId
  errorMessage.value = ''

  try {
    await admin.authorizedRequest(`/admin/payments/${intentId}/confirm`, {
      method: 'POST',
    })
    await loadPayments()
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudo confirmar el pago.')
  } finally {
    actionLoadingId.value = ''
  }
}

const rejectPayment = async (intentId) => {
  actionLoadingId.value = intentId
  errorMessage.value = ''

  try {
    await admin.authorizedRequest(`/admin/payments/${intentId}/reject`, {
      method: 'POST',
    })
    await loadPayments()
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudo rechazar el pago.')
  } finally {
    actionLoadingId.value = ''
  }
}
</script>

<template>
  <PageHeader
    title="Pagos"
    description="Revisa referencias y confirma manualmente pagos por transferencia."
  />

  <div v-if="errorMessage" class="status-message status-message--error fade-in">{{ errorMessage }}</div>
  <div v-if="!canReview" class="status-message fade-in">Tu rol puede ver pagos, pero no confirmarlos ni rechazarlos.</div>

  <section v-if="loading" class="panel fade-in">
    <p class="muted">Cargando pagos...</p>
  </section>

  <section v-else class="panel fade-in">
    <div v-if="sortedIntents.length" class="table-wrap">
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
          <tr v-for="intent in sortedIntents" :key="intent.id">
            <td>{{ intent.referenceCode || shortId(intent.id) }}</td>
            <td>{{ shortId(intent.orderId) }}</td>
            <td>{{ formatAmountWithCurrency(intent.amount, intent.currency) }}</td>
            <td><span class="pill">{{ intent.status }}</span></td>
            <td>{{ formatDateTime(intent.createdAt) }}</td>
            <td>
              <div class="actions-row" v-if="canReview && reviewableStatuses.has(intent.status)">
                <button
                  class="btn btn-primary"
                  type="button"
                  :disabled="actionLoadingId === intent.id"
                  @click="confirmPayment(intent.id)"
                >
                  Confirmar
                </button>
                <button
                  class="btn btn-danger"
                  type="button"
                  :disabled="actionLoadingId === intent.id"
                  @click="rejectPayment(intent.id)"
                >
                  Rechazar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">No hay pagos cargados en este contexto.</div>
  </section>
</template>
