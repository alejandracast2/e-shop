<script setup>
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { toErrorMessage } from '@/lib/api'

const auth = useAuthStore()
const admin = useAdminStore()

const loading = ref(false)
const errorMessage = ref('')
const customers = ref([])
const search = ref('')

const loadCustomers = async () => {
  if (!auth.isAuthenticated) return

  loading.value = true
  errorMessage.value = ''

  try {
    const payload = await admin.authorizedRequest('/admin/customers')
    customers.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No se pudieron cargar los clientes.')
  } finally {
    loading.value = false
  }
}

watch(
  () => admin.requestScopeKey,
  () => {
    void loadCustomers()
  },
  { immediate: true },
)

const filteredCustomers = computed(() => {
  const needle = search.value.trim().toLowerCase()
  if (!needle) return customers.value

  return customers.value.filter((customer) =>
    [customer.fullName, customer.email, customer.phone].filter(Boolean).join(' ').toLowerCase().includes(needle),
  )
})
</script>

<template>
  <PageHeader
    title="Clientes"
    description="Listado de compradores registrados para la store seleccionada."
  />

  <div v-if="errorMessage" class="status-message status-message--error fade-in">{{ errorMessage }}</div>

  <section class="panel fade-in">
    <div class="field-grid">
      <label class="field">
        <span>Buscar cliente</span>
        <input v-model.trim="search" type="text" placeholder="Nombre, email o telefono" />
      </label>
    </div>
  </section>

  <section v-if="loading" class="panel fade-in">
    <p class="muted">Cargando clientes...</p>
  </section>

  <section v-else class="panel fade-in">
    <div v-if="filteredCustomers.length" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Telefono</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in filteredCustomers" :key="customer.id">
            <td>{{ customer.fullName }}</td>
            <td>{{ customer.email || '--' }}</td>
            <td>{{ customer.phone || '--' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">No hay clientes que coincidan con la busqueda.</div>
  </section>
</template>
