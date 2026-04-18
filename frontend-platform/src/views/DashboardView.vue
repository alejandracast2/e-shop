<script setup>
import { computed, onMounted, ref } from 'vue'
import MetricCard from '@/components/MetricCard.vue'
import SectionCard from '@/components/SectionCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { platformEndpoints } from '@/data/platform-endpoints'
import { toErrorMessage } from '@/lib/api'
import { formatDateTime, shortId } from '@/lib/formatters'
import { useAuthStore } from '@/stores/auth'
import { usePlatformStore } from '@/stores/platform'

const auth = useAuthStore()
const platform = usePlatformStore()

const errorMessage = ref('')

const loadDashboard = async () => {
  errorMessage.value = ''

  try {
    await platform.loadDashboard()
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No fue posible cargar el dashboard.')
  }
}

const recentTenants = computed(() => platform.tenants.slice(0, 4))
const recentUsers = computed(() => platform.users.slice(0, 5))
const endpointGroups = computed(() => {
  const groups = new Map()

  for (const endpoint of platformEndpoints) {
    const current = groups.get(endpoint.group) || 0
    groups.set(endpoint.group, current + 1)
  }

  return Array.from(groups.entries()).map(([label, count]) => ({ label, count }))
})

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="page-stack">
    <section class="hero-card">
      <p class="eyebrow">Resumen operativo</p>
      <h2>Panel de plataforma conectado al backend real</h2>
      <p>
        Esta vista usa el login JWT y los endpoints protegidos para que un
        <span class="mono">platform_admin</span> pueda revisar tenants, stores y
        usuarios desde un solo lugar.
      </p>
      <div class="hero-card__actions">
        <div class="helper-chip">{{ platformEndpoints.length }} endpoints cubiertos</div>
        <div class="helper-chip">Usuario activo: {{ auth.user?.email || 'sin sesion' }}</div>
        <button class="button button--secondary" type="button" @click="loadDashboard">
          Recargar dashboard
        </button>
      </div>
    </section>

    <div v-if="errorMessage" class="notice notice--error">{{ errorMessage }}</div>

    <section class="stats-grid">
      <MetricCard
        eyebrow="Tenants"
        :value="platform.tenants.length"
        note="Total de tenants listados desde /platform/tenants"
      />
      <MetricCard
        eyebrow="Stores"
        :value="platform.totalStores"
        note="Acumulado en todos los tenants ya consultados"
        tone="teal"
      />
      <MetricCard
        eyebrow="Usuarios"
        :value="platform.users.length"
        note="Usuarios visibles via /users"
      />
      <MetricCard
        eyebrow="Usuarios activos"
        :value="platform.activeUsers"
        note="Estado actual segun la data del backend"
        tone="dark"
      />
    </section>

    <section class="double-grid">
      <SectionCard
        title="Tenants recientes"
        description="Vista rapida de los ultimos tenants recibidos del backend."
      >
        <div v-if="platform.loadingDashboard" class="loading-copy">Cargando tenants...</div>
        <div v-else-if="recentTenants.length" class="table-shell">
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Estado</th>
                <th>ID</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tenant in recentTenants" :key="tenant.id">
                <td>
                  <strong>{{ tenant.name }}</strong>
                </td>
                <td>
                  <StatusBadge
                    :label="tenant.status"
                    :tone="tenant.status === 'active' ? 'success' : 'warning'"
                  />
                </td>
                <td class="mono">{{ shortId(tenant.id) }}</td>
                <td>{{ formatDateTime(tenant.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">
          <h3>Sin tenants</h3>
          <p>Usa la vista Tenants para crear el primero.</p>
        </div>
      </SectionCard>

      <SectionCard
        title="Usuarios recientes"
        description="Lista rapida de usuarios administrables por platform_admin."
      >
        <div v-if="platform.loadingDashboard" class="loading-copy">Cargando usuarios...</div>
        <div v-else-if="recentUsers.length" class="table-shell">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Ultimo login</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in recentUsers" :key="user.id">
                <td>
                  <strong>{{ user.name }}</strong>
                  <div class="muted">{{ user.email }}</div>
                </td>
                <td>
                  <StatusBadge
                    :label="user.isActive ? 'activo' : 'inactivo'"
                    :tone="user.isActive ? 'success' : 'danger'"
                  />
                </td>
                <td>{{ formatDateTime(user.lastLoginAt) }}</td>
                <td class="mono">{{ shortId(user.id) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">
          <h3>Sin usuarios</h3>
          <p>El endpoint <span class="mono">GET /users</span> aun no devolvio registros.</p>
        </div>
      </SectionCard>
    </section>

    <section class="double-grid">
      <SectionCard
        title="Cobertura de endpoints"
        description="Cada seccion del frontend opera sobre endpoints existentes del backend."
      >
        <div class="triple-grid">
          <article v-for="group in endpointGroups" :key="group.label" class="summary-card">
            <div class="summary-card__head">
              <div class="summary-card__title">
                <h3>{{ group.label }}</h3>
                <p class="muted">{{ group.count }} operaciones disponibles</p>
              </div>
              <StatusBadge label="Activo" tone="accent" />
            </div>
          </article>
        </div>
      </SectionCard>

      <SectionCard
        title="Accesos del usuario actual"
        description="Informacion proveniente del JWT emitido por /auth/login."
      >
        <div class="empty-state">
          <h3>{{ auth.user?.name || 'Sin usuario cargado' }}</h3>
          <p>{{ auth.user?.email || 'No hay sesion activa.' }}</p>
          <p>
            Roles presentes:
            <span class="mono">
              {{ auth.user?.roles?.map((assignment) => assignment.role).join(', ') || 'ninguno' }}
            </span>
          </p>
        </div>
      </SectionCard>
    </section>
  </div>
</template>
