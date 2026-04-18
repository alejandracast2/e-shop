<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/formatters'
import { toErrorMessage } from '@/lib/api'

const route = useRoute()
const auth = useAuthStore()
const admin = useAdminStore()

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const order = ref(null)

const form = reactive({
  status: 'pending_payment',
  paymentStatus: 'unpaid',
  fulfillmentStatus: 'unfulfilled',
})

const loadOrder = async () => {
  if (!auth.isAuthenticated) return

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  order.value = null

  try {
    order.value = await admin.authorizedRequest(`/admin/orders/${route.params.id}`)
    form.status = order.value?.status || 'pending_payment'
    form.paymentStatus = order.value?.paymentStatus || 'unpaid'
    form.fulfillmentStatus = order.value?.fulfillmentStatus || 'unfulfilled'
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudo cargar el pedido.')
    order.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => [admin.requestScopeKey, route.params.id],
  () => {
    void loadOrder()
  },
  { immediate: true },
)

const canUpdate = computed(() => auth.canUpdateOrders)
const orderLabel = computed(() => (order.value ? `Pedido #${order.value.orderNumber}` : 'Detalle de pedido'))

const updateOrder = async () => {
  if (!canUpdate.value) return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await admin.authorizedRequest(`/admin/orders/${route.params.id}`, {
      method: 'PATCH',
      body: {
        status: form.status,
        paymentStatus: form.paymentStatus,
        fulfillmentStatus: form.fulfillmentStatus,
      },
    })

    successMessage.value = 'Cambios guardados.'
    await loadOrder()
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudo actualizar el pedido.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageHeader
    :title="orderLabel"
    description="Revisa items, cliente y estado operativo del pedido."
  />

  <div v-if="errorMessage" class="status-message status-message--error fade-in">{{ errorMessage }}</div>
  <div v-if="successMessage" class="status-message status-message--success fade-in">{{ successMessage }}</div>
  <div v-if="!canUpdate" class="status-message fade-in">Tu rol puede ver este pedido, pero no cambiar estados.</div>

  <section v-if="loading" class="panel fade-in">
    <p class="muted">Cargando detalle del pedido...</p>
  </section>

  <template v-else-if="order">
    <section class="grid-3 fade-in">
      <article class="panel">
        <h2>Estado</h2>

        <label class="field">
          <span>Status</span>
          <select v-model="form.status" :disabled="!canUpdate">
            <option value="pending_payment">pending_payment</option>
            <option value="paid">paid</option>
            <option value="processing">processing</option>
            <option value="fulfilled">fulfilled</option>
            <option value="cancelled">cancelled</option>
            <option value="refunded">refunded</option>
          </select>
        </label>

        <label class="field">
          <span>Pago</span>
          <select v-model="form.paymentStatus" :disabled="!canUpdate">
            <option value="unpaid">unpaid</option>
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="failed">failed</option>
            <option value="refunded">refunded</option>
          </select>
        </label>

        <label class="field">
          <span>Fulfillment</span>
          <select v-model="form.fulfillmentStatus" :disabled="!canUpdate">
            <option value="unfulfilled">unfulfilled</option>
            <option value="partial">partial</option>
            <option value="fulfilled">fulfilled</option>
            <option value="shipped">shipped</option>
            <option value="delivered">delivered</option>
          </select>
        </label>

        <button class="btn btn-primary" type="button" :disabled="saving || !canUpdate" @click="updateOrder">
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </article>

      <article class="panel">
        <h2>Cliente</h2>
        <p><strong>{{ order.customer?.fullName || 'Sin cliente' }}</strong></p>
        <p class="muted">{{ order.customer?.email || 'Sin email' }}</p>
        <p class="muted">{{ order.customer?.phone || 'Sin telefono' }}</p>
      </article>

      <article class="panel">
        <h2>Totales</h2>
        <p class="order-total">{{ formatCurrency(order.totalAmount) }}</p>
        <p class="muted">Subtotal: {{ formatCurrency(order.subtotalAmount) }}</p>
      </article>
    </section>

    <section class="panel fade-in">
      <h2>Items</h2>

      <div v-if="order.items?.length" class="list">
        <div v-for="item in order.items" :key="item.id" class="list-row">
          <div>
            <strong>{{ item.titleSnapshot }}</strong>
            <div class="muted">Cantidad: {{ item.quantity }}</div>
            <div class="muted">SKU: {{ item.skuSnapshot || '--' }}</div>
          </div>
          <div>{{ formatCurrency(item.totalPrice) }}</div>
        </div>
      </div>

      <div v-else class="empty-state">Este pedido no tiene items registrados.</div>
    </section>
  </template>

  <section v-else class="panel fade-in">
    <div class="empty-state">No fue posible cargar el detalle del pedido.</div>
  </section>
</template>

<style scoped>
h2 {
  margin-top: 0;
}

.order-total {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 8px;
}
</style>
