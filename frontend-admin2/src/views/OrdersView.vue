<script setup>
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/formatters'
import { toErrorMessage } from '@/lib/api'

const auth = useAuthStore()
const admin = useAdminStore()

const loading = ref(false)
const errorMessage = ref('')
const orders = ref([])
const statusFilter = ref('all')

const loadOrders = async () => {
  if (!auth.isAuthenticated) return

  loading.value = true
  errorMessage.value = ''

  try {
    const path =
      statusFilter.value === 'all'
        ? '/admin/orders'
        : `/admin/orders?status=${encodeURIComponent(statusFilter.value)}`

    const payload = await admin.authorizedRequest(path)
    orders.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudieron cargar los pedidos.')
  } finally {
    loading.value = false
  }
}

watch(
  () => [admin.requestScopeKey, statusFilter.value],
  () => {
    void loadOrders()
  },
  { immediate: true },
)

const sortedOrders = computed(() =>
  [...orders.value].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
)
</script>

<template>
  <PageHeader
    title="Pedidos"
    description="Monitorea estados, cobro y fulfillment desde una sola vista."
  />

  <div v-if="errorMessage" class="status-message status-message--error fade-in">{{ errorMessage }}</div>

  <section class="panel fade-in">
    <div class="field-grid">
      <label class="field">
        <span>Filtrar por estado</span>
        <select v-model="statusFilter">
          <option value="all">Todos</option>
          <option value="pending_payment">pending_payment</option>
          <option value="paid">paid</option>
          <option value="processing">processing</option>
          <option value="fulfilled">fulfilled</option>
          <option value="cancelled">cancelled</option>
          <option value="refunded">refunded</option>
        </select>
      </label>
    </div>
  </section>

  <section v-if="loading" class="panel fade-in">
    <p class="muted">Cargando pedidos...</p>
  </section>

  <section v-else class="panel fade-in">
    <div v-if="sortedOrders.length" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Orden</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Status</th>
            <th>Pago</th>
            <th>Fulfillment</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in sortedOrders" :key="order.id">
            <td>#{{ order.orderNumber }}</td>
            <td>{{ order.customer?.fullName || 'Sin cliente' }}</td>
            <td>{{ formatCurrency(order.totalAmount) }}</td>
            <td><span class="pill">{{ order.status }}</span></td>
            <td><span class="pill">{{ order.paymentStatus }}</span></td>
            <td><span class="pill">{{ order.fulfillmentStatus || 'unfulfilled' }}</span></td>
            <td>
              <RouterLink class="btn btn-ghost" :to="{ name: 'order-detail', params: { id: order.id } }">
                Ver
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">No hay pedidos para el filtro seleccionado.</div>
  </section>
</template>
