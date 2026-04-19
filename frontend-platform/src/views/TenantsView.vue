<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SectionCard from '@/components/SectionCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { toErrorMessage } from '@/lib/api'
import { formatDateTime, shortId } from '@/lib/formatters'
import { usePlatformStore } from '@/stores/platform'

const platform = usePlatformStore()

const tenantForm = reactive({
  name: '',
  ownerUserId: '',
})

const storeForm = reactive({
  name: '',
  slug: '',
  email: '',
  phone: '',
  address1: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  currency: 'USD',
  timezone: 'America/Bogota',
})

const selectedTenantId = ref('')
const tenantQuery = ref('')
const tenantMessage = ref('')
const storeMessage = ref('')
const tenantError = ref('')
const storeError = ref('')
const creatingTenant = ref(false)
const creatingStore = ref(false)

const selectedTenant = computed(
  () => platform.tenants.find((tenant) => tenant.id === selectedTenantId.value) || null,
)
const selectedStores = computed(() =>
  selectedTenantId.value ? platform.storesForTenant(selectedTenantId.value) : [],
)
const filteredTenants = computed(() => {
  const needle = tenantQuery.value.trim().toLowerCase()
  if (!needle) return platform.tenants

  return platform.tenants.filter((tenant) =>
    [tenant.name, tenant.id, tenant.ownerUserId || '']
      .join(' ')
      .toLowerCase()
      .includes(needle),
  )
})

const resetStoreForm = () => {
  storeForm.name = ''
  storeForm.slug = ''
  storeForm.email = ''
  storeForm.phone = ''
  storeForm.address1 = ''
  storeForm.city = ''
  storeForm.state = ''
  storeForm.zip = ''
  storeForm.country = ''
  storeForm.currency = 'USD'
  storeForm.timezone = 'America/Bogota'
}

const loadTenants = async () => {
  tenantError.value = ''

  try {
    await platform.fetchTenants(true)

    if (!selectedTenantId.value && platform.tenants[0]) {
      selectedTenantId.value = platform.tenants[0].id
    }

    await Promise.all(platform.tenants.map((tenant) => platform.fetchStores(tenant.id, true)))
  } catch (error) {
    tenantError.value = toErrorMessage(error, 'No fue posible cargar los tenants.')
  }
}

const buildAddressPayload = () => {
  const addressEntries = Object.entries({
    address1: storeForm.address1,
    city: storeForm.city,
    state: storeForm.state,
    zip: storeForm.zip,
    country: storeForm.country,
  }).filter(([, value]) => value)

  return addressEntries.length ? Object.fromEntries(addressEntries) : undefined
}

const createTenant = async () => {
  creatingTenant.value = true
  tenantMessage.value = ''
  tenantError.value = ''

  try {
    const tenant = await platform.createTenant({
      name: tenantForm.name,
      ...(tenantForm.ownerUserId ? { ownerUserId: tenantForm.ownerUserId } : {}),
    })

    tenantForm.name = ''
    tenantForm.ownerUserId = ''
    selectedTenantId.value = tenant.id
    await platform.fetchStores(tenant.id, true)
    tenantMessage.value = `Tenant creado correctamente: ${tenant.name}.`
  } catch (error) {
    tenantError.value = toErrorMessage(error, 'No fue posible crear el tenant.')
  } finally {
    creatingTenant.value = false
  }
}

const createStore = async () => {
  if (!selectedTenantId.value) {
    storeError.value = 'Selecciona un tenant antes de crear una store.'
    return
  }

  creatingStore.value = true
  storeMessage.value = ''
  storeError.value = ''

  try {
    const store = await platform.createStore(selectedTenantId.value, {
      name: storeForm.name,
      slug: storeForm.slug,
      ...(storeForm.email ? { email: storeForm.email } : {}),
      ...(storeForm.phone ? { phone: storeForm.phone } : {}),
      ...(buildAddressPayload() ? { addressJson: buildAddressPayload() } : {}),
      ...(storeForm.currency ? { currency: storeForm.currency } : {}),
      ...(storeForm.timezone ? { timezone: storeForm.timezone } : {}),
    })

    resetStoreForm()
    storeMessage.value = `Store creada correctamente: ${store.name}.`
  } catch (error) {
    storeError.value = toErrorMessage(error, 'No fue posible crear la store.')
  } finally {
    creatingStore.value = false
  }
}

const suggestSlug = () => {
  if (!storeForm.name || storeForm.slug) return

  storeForm.slug = storeForm.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

watch(selectedTenantId, async (tenantId) => {
  if (!tenantId) return
  storeMessage.value = ''
  storeError.value = ''
  await platform.fetchStores(tenantId)
})

onMounted(() => {
  loadTenants()
})
</script>

<template>
  <div class="page-stack">
    <section class="hero-card">
      <p class="eyebrow">Tenancy management</p>
      <h2>Administracion central de tenants y stores</h2>
      <p>
        Esta pantalla opera sobre <span class="mono">GET/POST /platform/tenants</span> y
        <span class="mono">GET/POST /platform/tenants/:tenantId/stores</span>.
      </p>
      <div class="hero-card__actions">
        <div class="helper-chip">{{ platform.tenants.length }} tenants en memoria</div>
        <div class="helper-chip">{{ platform.totalStores }} stores cargadas</div>
        <button class="button button--secondary" type="button" @click="loadTenants">
          Refrescar tenants
        </button>
      </div>
    </section>

    <div v-if="tenantError" class="notice notice--error">{{ tenantError }}</div>
    <div v-if="tenantMessage" class="notice notice--success">{{ tenantMessage }}</div>
    <div v-if="storeError" class="notice notice--error">{{ storeError }}</div>
    <div v-if="storeMessage" class="notice notice--success">{{ storeMessage }}</div>

    <section class="double-grid">
      <SectionCard
        title="Crear tenant"
        description="Crea tenants nuevos y opcionalmente vincula un ownerUserId."
      >
        <form class="form-grid" @submit.prevent="createTenant">
          <label class="field">
            <span>Nombre del tenant</span>
            <input v-model.trim="tenantForm.name" type="text" placeholder="Cafe de Origen" required />
          </label>

          <label class="field">
            <span>Owner user id</span>
            <input
              v-model.trim="tenantForm.ownerUserId"
              type="text"
              placeholder="UUID opcional"
            />
            <small>Si lo dejas vacio, el tenant se crea sin owner asignado.</small>
          </label>

          <div class="toolbar">
            <button class="button button--primary" type="submit" :disabled="creatingTenant">
              {{ creatingTenant ? 'Creando tenant...' : 'Crear tenant' }}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Tenants registrados"
        description="Selecciona un tenant para consultar sus stores o abrir el formulario de alta."
      >
        <template #actions>
          <input
            v-model.trim="tenantQuery"
            class="search-input"
            type="search"
            placeholder="Buscar por nombre o id"
          />
        </template>

        <div v-if="filteredTenants.length" class="tenant-list">
          <button
            v-for="tenant in filteredTenants"
            :key="tenant.id"
            type="button"
            class="tenant-row"
            :class="{ 'is-selected': tenant.id === selectedTenantId }"
            @click="selectedTenantId = tenant.id"
          >
            <div class="tenant-row__head">
              <div class="tenant-row__title">
                <h3>{{ tenant.name }}</h3>
                <p class="muted">ID {{ shortId(tenant.id) }}</p>
              </div>
              <StatusBadge
                :label="tenant.status"
                :tone="tenant.status === 'active' ? 'success' : 'warning'"
              />
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <strong>Owner user id</strong>
                <span>{{ tenant.ownerUserId || 'Sin owner' }}</span>
              </div>
              <div class="meta-item">
                <strong>Stores</strong>
                <span>{{ platform.storesForTenant(tenant.id).length }}</span>
              </div>
              <div class="meta-item">
                <strong>Creado</strong>
                <span>{{ formatDateTime(tenant.createdAt) }}</span>
              </div>
              <div class="meta-item">
                <strong>Actualizado</strong>
                <span>{{ formatDateTime(tenant.updatedAt) }}</span>
              </div>
            </div>
          </button>
        </div>
        <div v-else class="empty-state">
          <h3>Sin resultados</h3>
          <p>No hay tenants que coincidan con el filtro actual.</p>
        </div>
      </SectionCard>
    </section>

    <section class="double-grid">
      <SectionCard
        title="Stores por tenant"
        description="Listado obtenido con el endpoint de stores anidado."
      >
        <div v-if="selectedTenant" class="stack-sm">
          <div class="inline-row">
            <div>
              <h3>{{ selectedTenant.name }}</h3>
              <p class="muted">Tenant seleccionado: {{ selectedTenant.id }}</p>
            </div>
            <StatusBadge
              :label="`${selectedStores.length} stores`"
              :tone="selectedStores.length ? 'accent' : 'neutral'"
            />
          </div>

          <div v-if="platform.loadingStoresByTenant[selectedTenant.id]" class="loading-copy">
            Cargando stores...
          </div>

          <div v-else-if="selectedStores.length" class="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Slug</th>
                  <th>store id</th>
                  <th>Contacto</th>
                  <th>Operacion</th>
                  <th>Creada</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="store in selectedStores" :key="store.id">
                  <td>
                    <strong>{{ store.name }}</strong>
                    
                  </td>
                 
                  <td class="mono">{{ store.slug }}</td>
                  <td class="mono">{{ shortId(store.id) }}</td>
                  <td>
                    <div>{{ store.email || 'Sin email' }}</div>
                    <div class="muted">{{ store.phone || 'Sin telefono' }}</div>
                  </td>
                  <td>
                    <div>{{ store.currency }}</div>
                    <div class="muted">{{ store.timezone }}</div>
                  </td>
                  <td>{{ formatDateTime(store.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-state">
            <h3>Sin stores</h3>
            <p>Este tenant aun no tiene stores cargadas.</p>
          </div>
        </div>

        <div v-else class="empty-state">
          <h3>Selecciona un tenant</h3>
          <p>El listado de stores necesita un tenant activo para consultar el endpoint anidado.</p>
        </div>
      </SectionCard>

      <SectionCard
        title="Crear store"
        description="Alta de stores dentro del tenant seleccionado."
      >
        <form class="form-grid" @submit.prevent="createStore">
          <label class="field">
            <span>Tenant destino</span>
            <input :value="selectedTenant?.name || 'Selecciona un tenant en la columna izquierda'" type="text" disabled />
          </label>

          <div class="field-grid">
            <label class="field">
              <span>Nombre de la store</span>
              <input v-model.trim="storeForm.name" type="text" placeholder="Cafe Centro" required />
            </label>

            <label class="field">
              <span>Slug</span>
              <input v-model.trim="storeForm.slug" type="text" placeholder="cafe-centro" required />
              <small>Usa un slug unico por tenant.</small>
            </label>
          </div>

          <div class="toolbar">
            <button class="button button--ghost" type="button" @click="suggestSlug">
              Generar slug
            </button>
          </div>

          <div class="field-grid">
            <label class="field">
              <span>Email</span>
              <input v-model.trim="storeForm.email" type="email" placeholder="ventas@tenant.com" />
            </label>

            <label class="field">
              <span>Telefono</span>
              <input v-model.trim="storeForm.phone" type="text" placeholder="+57 300 000 0000" />
            </label>
          </div>

          <div class="compact-grid">
            <label class="field">
              <span>Moneda</span>
              <input v-model.trim="storeForm.currency" type="text" placeholder="USD" />
            </label>

            <label class="field">
              <span>Timezone</span>
              <input v-model.trim="storeForm.timezone" type="text" placeholder="America/Bogota" />
            </label>

            <label class="field">
              <span>Pais</span>
              <input v-model.trim="storeForm.country" type="text" placeholder="CO" />
            </label>
          </div>

          <div class="field-grid">
            <label class="field">
              <span>Direccion</span>
              <input v-model.trim="storeForm.address1" type="text" placeholder="Calle 123 #45-67" />
            </label>

            <label class="field">
              <span>Ciudad</span>
              <input v-model.trim="storeForm.city" type="text" placeholder="Bogota" />
            </label>
          </div>

          <div class="compact-grid">
            <label class="field">
              <span>Estado</span>
              <input v-model.trim="storeForm.state" type="text" placeholder="Cundinamarca" />
            </label>

            <label class="field">
              <span>ZIP</span>
              <input v-model.trim="storeForm.zip" type="text" placeholder="110111" />
            </label>
          </div>

          <div class="toolbar">
            <button class="button button--primary" type="submit" :disabled="creatingStore || !selectedTenantId">
              {{ creatingStore ? 'Creando store...' : 'Crear store' }}
            </button>
          </div>
        </form>
      </SectionCard>
    </section>
  </div>
</template>
