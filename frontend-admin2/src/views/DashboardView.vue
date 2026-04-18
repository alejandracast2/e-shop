<script setup>
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency, shortId } from '@/utils/formatters'
import { toErrorMessage } from '@/lib/api'

const auth = useAuthStore()
const admin = useAdminStore()

const loading = ref(false)
const errorMessage = ref('')
const products = ref([])
const orders = ref([])
const customers = ref([])

const minStock = (product) =>
  Math.min(...((product.variants || []).map((variant) => variant.availableStock || 0).length
    ? (product.variants || []).map((variant) => variant.availableStock || 0)
    : [0]))

const loadDashboard = async () => {
  if (!auth.isAuthenticated) return

  loading.value = true
  errorMessage.value = ''

  try {
    const [productPayload, orderPayload, customerPayload] = await Promise.all([
      admin.authorizedRequest('/admin/products'),
      admin.authorizedRequest('/admin/orders'),
      admin.authorizedRequest('/admin/customers'),
    ])

    products.value = Array.isArray(productPayload) ? productPayload : []
    orders.value = Array.isArray(orderPayload) ? orderPayload : []
    customers.value = Array.isArray(customerPayload) ? customerPayload : []
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudo cargar el dashboard.')
  } finally {
    loading.value = false
  }
}

watch(
  () => admin.requestScopeKey,
  () => {
    void loadDashboard()
  },
  { immediate: true },
)

const productCount = computed(() => products.value.length)
const orderCount = computed(() => orders.value.length)
const revenue = computed(() =>
  orders.value.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
)
const recentOrders = computed(() => orders.value.slice(0, 5))
const lowStockProducts = computed(() => products.value.filter((product) => minStock(product) < 5).slice(0, 5))
const recentCustomers = computed(() => customers.value.slice(0, 5))
</script>

<template>
  <PageHeader
    title="Dashboard"
    description="Vista rapida de catalogo, pedidos, clientes y rendimiento general."
  />

  <div v-if="errorMessage" class="status-message status-message--error fade-in">{{ errorMessage }}</div>

  <section v-if="loading" class="panel fade-in">
    <p class="muted">Cargando metricas del panel...</p>
  </section>

  <template v-else>
    <section class="grid-3 fade-in">
      <StatCard
        label="Productos activos"
        :value="productCount"
        trend="catalogo vivo"
        footer="Total visible en la store actual"
      />
      <StatCard
        label="Pedidos registrados"
        :value="orderCount"
        trend="flujo actual"
        footer="Pedidos encontrados para el contexto activo"
      />
      <StatCard
        label="Ingresos"
        :value="formatCurrency(revenue)"
        trend="total acumulado"
        footer="Suma de order.totalAmount"
      />
    </section>

    <section class="grid-3 fade-in">
      <article class="panel">
        <h2>Ultimos pedidos</h2>
        <div v-if="recentOrders.length" class="list">
          <div v-for="order in recentOrders" :key="order.id" class="list-row">
            <div>
              <strong>#{{ order.orderNumber }}</strong>
              <div class="muted">
                {{ order.customer?.fullName || 'Sin cliente' }} · {{ shortId(order.id) }}
              </div>
            </div>
            <span class="pill">{{ order.status }}</span>
          </div>
        </div>
        <div v-else class="empty-state">Todavia no hay pedidos para mostrar.</div>
      </article>

      <article class="panel">
        <h2>Productos con poco stock</h2>
        <div v-if="lowStockProducts.length" class="list">
          <div v-for="product in lowStockProducts" :key="product.id" class="list-row">
            <div>
              <strong>{{ product.title }}</strong>
              <div class="muted">{{ product.brand || product.category?.name || 'Sin marca' }}</div>
            </div>
            <span class="pill">{{ minStock(product) }} uds</span>
          </div>
        </div>
        <div v-else class="empty-state">El inventario minimo luce estable.</div>
      </article>

      <article class="panel">
        <h2>Clientes recientes</h2>
        <div v-if="recentCustomers.length" class="list">
          <div v-for="customer in recentCustomers" :key="customer.id" class="list-row">
            <div>
              <strong>{{ customer.fullName }}</strong>
              <div class="muted">{{ customer.email || 'Sin email' }}</div>
            </div>
            <span class="pill">{{ customer.phone || '--' }}</span>
          </div>
        </div>
        <div v-else class="empty-state">Aun no hay clientes registrados.</div>
      </article>
    </section>
  </template>
</template>

<style scoped>
h2 {
  margin-top: 0;
  margin-bottom: 14px;
  font-size: 1.05rem;
}
</style>
