<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SectionCard from '@/components/SectionCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { toErrorMessage } from '@/lib/api'
import { formatDate, formatDateTime, shortId } from '@/lib/formatters'
import { usePlatformStore } from '@/stores/platform'

const platform = usePlatformStore()

const roleOptions = [
  { value: '', label: 'Sin rol inicial' },
  { value: 'platform_admin', label: 'platform_admin' },
  { value: 'tenant_owner', label: 'tenant_owner' },
  { value: 'store_admin', label: 'store_admin' },
  { value: 'store_staff', label: 'store_staff' },
  { value: 'customer', label: 'customer' },
]

const createForm = reactive({
  name: '',
  email: '',
  password: '',
  roleName: '',
  tenantId: '',
  storeId: '',
  phone: '',
  isActive: true,
})

const editForm = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
  isActive: true,
})

const selectedUserId = ref('')
const selectedTenantId = ref('')
const query = ref('')
const createMessage = ref('')
const createError = ref('')
const editMessage = ref('')
const editError = ref('')
const creatingUser = ref(false)
const updatingUser = ref(false)
const removingUser = ref(false)
const loadingUserDetail = ref(false)

const userBelongsToTenant = (user, tenantId) =>
  Array.isArray(user.roles) && user.roles.some((assignment) => assignment.tenantId === tenantId)

const tenantUsers = computed(() => {
  if (!selectedTenantId.value) return []
  return platform.users.filter((user) => userBelongsToTenant(user, selectedTenantId.value))
})

const usersFiltered = computed(() => {
  const scopedUsers = tenantUsers.value
  const needle = query.value.trim().toLowerCase()
  if (!needle) return scopedUsers

  return scopedUsers.filter((user) =>
    [user.name, user.email, user.phone || '', user.id].join(' ').toLowerCase().includes(needle),
  )
})

const selectedUser = computed(
  () => platform.userDetailsById[selectedUserId.value] || platform.users.find((user) => user.id === selectedUserId.value) || null,
)
const selectedTenant = computed(
  () => platform.tenants.find((tenant) => tenant.id === selectedTenantId.value) || null,
)
const createStores = computed(() =>
  createForm.tenantId ? platform.storesForTenant(createForm.tenantId) : [],
)
const requiresTenant = computed(() =>
  ['tenant_owner', 'store_admin', 'store_staff'].includes(createForm.roleName),
)
const requiresStore = computed(() => ['store_admin', 'store_staff'].includes(createForm.roleName))

const resetCreateForm = () => {
  createForm.name = ''
  createForm.email = ''
  createForm.password = ''
  createForm.roleName = ''
  createForm.tenantId = ''
  createForm.storeId = ''
  createForm.phone = ''
  createForm.isActive = true
}

const syncEditForm = (user) => {
  editForm.name = user?.name || ''
  editForm.email = user?.email || ''
  editForm.password = ''
  editForm.phone = user?.phone || ''
  editForm.isActive = Boolean(user?.isActive)
}

const clearSelectedUser = () => {
  selectedUserId.value = ''
  syncEditForm(null)
}

const loadUsers = async () => {
  createError.value = ''
  editError.value = ''

  try {
    await Promise.all([platform.fetchUsers(true), platform.fetchTenants(true)])

    if (!selectedTenantId.value) {
      clearSelectedUser()
      return
    }

    const nextUser = tenantUsers.value.find((user) => user.id === selectedUserId.value) || tenantUsers.value[0]
    if (nextUser) {
      await selectUser(nextUser.id)
    } else {
      clearSelectedUser()
    }
  } catch (error) {
    createError.value = toErrorMessage(error, 'No fue posible cargar los usuarios.')
  }
}

const selectUser = async (userId) => {
  selectedUserId.value = userId
  loadingUserDetail.value = true
  editError.value = ''

  try {
    const user = await platform.fetchUser(userId, true)
    syncEditForm(user)
  } catch (error) {
    editError.value = toErrorMessage(error, 'No fue posible cargar el detalle del usuario.')
  } finally {
    loadingUserDetail.value = false
  }
}

const createUser = async () => {
  createMessage.value = ''
  createError.value = ''

  if (requiresTenant.value && !createForm.tenantId) {
    createError.value = 'Selecciona un tenant antes de asignar ese rol.'
    return
  }

  if (requiresStore.value && !createForm.storeId) {
    createError.value = 'Selecciona una store para roles de store.'
    return
  }

  creatingUser.value = true

  try {
    const user = await platform.createUser({
      name: createForm.name,
      email: createForm.email,
      password: createForm.password,
      ...(createForm.roleName ? { roleName: createForm.roleName } : {}),
      ...(createForm.tenantId ? { tenantId: createForm.tenantId } : {}),
      ...(createForm.storeId ? { storeId: createForm.storeId } : {}),
      ...(createForm.phone ? { phone: createForm.phone } : {}),
      isActive: createForm.isActive,
    })

    createMessage.value = `Usuario creado correctamente: ${user.email}.`
    resetCreateForm()
    await selectUser(user.id)
  } catch (error) {
    createError.value = toErrorMessage(error, 'No fue posible crear el usuario.')
  } finally {
    creatingUser.value = false
  }
}

const updateUser = async () => {
  if (!selectedUserId.value) {
    editError.value = 'Selecciona un usuario antes de editar.'
    return
  }

  updatingUser.value = true
  editMessage.value = ''
  editError.value = ''

  try {
    const user = await platform.updateUser(selectedUserId.value, {
      name: editForm.name,
      email: editForm.email,
      ...(editForm.password ? { password: editForm.password } : {}),
      ...(editForm.phone ? { phone: editForm.phone } : {}),
      isActive: editForm.isActive,
    })

    syncEditForm(user)
    editMessage.value = `Usuario actualizado correctamente: ${user.email}.`
  } catch (error) {
    editError.value = toErrorMessage(error, 'No fue posible actualizar el usuario.')
  } finally {
    updatingUser.value = false
  }
}

const deleteUser = async () => {
  if (!selectedUserId.value) return

  const confirmed = window.confirm('Vas a eliminar este usuario. Deseas continuar?')
  if (!confirmed) return

  removingUser.value = true
  editMessage.value = ''
  editError.value = ''

  try {
    const nextUserId =
      tenantUsers.value.find((user) => user.id !== selectedUserId.value)?.id || ''

    await platform.deleteUser(selectedUserId.value)
    clearSelectedUser()

    if (nextUserId) {
      await selectUser(nextUserId)
    }

    editMessage.value = 'Usuario eliminado correctamente.'
  } catch (error) {
    editError.value = toErrorMessage(error, 'No fue posible eliminar el usuario.')
  } finally {
    removingUser.value = false
  }
}

watch(
  () => createForm.roleName,
  (roleName) => {
    if (!['tenant_owner', 'store_admin', 'store_staff'].includes(roleName)) {
      createForm.tenantId = ''
    }

    if (!['store_admin', 'store_staff'].includes(roleName)) {
      createForm.storeId = ''
    }
  },
)

watch(
  () => createForm.tenantId,
  async (tenantId) => {
    createForm.storeId = ''
    if (!tenantId) return
    await platform.fetchStores(tenantId)
  },
)

watch(
  selectedTenantId,
  async (tenantId) => {
    query.value = ''

    if (!tenantId) {
      clearSelectedUser()
      return
    }

    const nextUser = tenantUsers.value.find((user) => user.id === selectedUserId.value) || tenantUsers.value[0]
    if (!nextUser) {
      clearSelectedUser()
      return
    }

    if (nextUser.id !== selectedUserId.value || !selectedUser.value) {
      await selectUser(nextUser.id)
    }
  },
)

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="page-stack">
    <section class="hero-card">
      <p class="eyebrow">User administration</p>
      <h2>CRUD de usuarios para platform_admin</h2>
      <p>
        Esta vista cubre <span class="mono">GET /users</span>,
        <span class="mono">GET /users/:id</span>,
        <span class="mono">POST /users</span>,
        <span class="mono">PATCH /users/:id</span> y
        <span class="mono">DELETE /users/:id</span>.
      </p>
      <div class="hero-card__actions">
        <div class="helper-chip">{{ platform.users.length }} usuarios cargados</div>
        <div class="helper-chip">{{ platform.activeUsers }} activos</div>
        <div class="helper-chip">
          {{ selectedTenant ? `${tenantUsers.length} usuarios en ${selectedTenant.name}` : 'Selecciona un tenant para listar usuarios' }}
        </div>
        <button class="button button--secondary" type="button" @click="loadUsers">
          Refrescar usuarios
        </button>
      </div>
    </section>

    <div v-if="createError" class="notice notice--error">{{ createError }}</div>
    <div v-if="createMessage" class="notice notice--success">{{ createMessage }}</div>
    <div v-if="editError" class="notice notice--error">{{ editError }}</div>
    <div v-if="editMessage" class="notice notice--success">{{ editMessage }}</div>

    <section class="double-grid">
      <SectionCard
        title="Crear usuario"
        description="El alta permite asignar un rol inicial con alcance opcional por tenant o store."
      >
        <form class="form-grid" @submit.prevent="createUser">
          <div class="field-grid">
            <label class="field">
              <span>Nombre</span>
              <input v-model.trim="createForm.name" type="text" placeholder="Platform Ops" required />
            </label>

            <label class="field">
              <span>Email</span>
              <input v-model.trim="createForm.email" type="email" placeholder="ops@eshop.com" required />
            </label>
          </div>

          <div class="field-grid">
            <label class="field">
              <span>Password</span>
              <input
                v-model="createForm.password"
                type="password"
                minlength="6"
                placeholder="Minimo 6 caracteres"
                required
              />
            </label>

            <label class="field">
              <span>Telefono</span>
              <input v-model.trim="createForm.phone" type="text" placeholder="+57 300 000 0000" />
            </label>
          </div>

          <div class="field-grid">
            <label class="field">
              <span>Rol inicial</span>
              <select v-model="createForm.roleName">
                <option v-for="option in roleOptions" :key="option.value || 'none'" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <small>El endpoint de update no cambia roles; la asignacion ocurre al crear.</small>
            </label>

            <label class="field">
              <span>Estado</span>
              <select v-model="createForm.isActive">
                <option :value="true">Activo</option>
                <option :value="false">Inactivo</option>
              </select>
            </label>
          </div>

          <div class="field-grid">
            <label class="field">
              <span>Tenant</span>
              <select v-model="createForm.tenantId" :disabled="!requiresTenant">
                <option value="">Selecciona un tenant</option>
                <option v-for="tenant in platform.tenants" :key="tenant.id" :value="tenant.id">
                  {{ tenant.name }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Store</span>
              <select v-model="createForm.storeId" :disabled="!requiresStore">
                <option value="">Selecciona una store</option>
                <option v-for="store in createStores" :key="store.id" :value="store.id">
                  {{ store.name }}
                </option>
              </select>
            </label>
          </div>

          <div class="toolbar">
            <button class="button button--primary" type="submit" :disabled="creatingUser">
              {{ creatingUser ? 'Creando usuario...' : 'Crear usuario' }}
            </button>
            <button class="button button--ghost" type="button" @click="resetCreateForm">
              Limpiar formulario
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Usuarios registrados"
        description="Primero elige un tenant; la tabla solo muestra usuarios asociados a ese tenant."
      >
        <template #actions>
          <div class="table-toolbar">
            <select v-model="selectedTenantId" class="search-input">
              <option value="">Selecciona un tenant</option>
              <option v-for="tenant in platform.tenants" :key="tenant.id" :value="tenant.id">
                {{ tenant.name }}
              </option>
            </select>
            <input
              v-model.trim="query"
              class="search-input"
              type="search"
              placeholder="Buscar por nombre, email o id"
              :disabled="!selectedTenantId"
            />
          </div>
        </template>

        <div v-if="!selectedTenantId" class="empty-state">
          <h3>Selecciona un tenant</h3>
          <p>El listado de usuarios se habilita cuando eliges el tenant que quieres revisar.</p>
        </div>
        <div v-else-if="usersFiltered.length" class="table-shell">
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
              <tr
                v-for="user in usersFiltered"
                :key="user.id"
                @click="selectUser(user.id)"
                style="cursor: pointer;"
              >
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
          <h3>Sin coincidencias</h3>
          <p>No hay usuarios que cumplan con el filtro actual.</p>
        </div>
      </SectionCard>
    </section>

    <SectionCard
      title="Detalle y edicion"
      description="El detalle se carga con GET /users/:id antes de enviar cambios."
    >
      <div v-if="loadingUserDetail" class="loading-copy">Cargando detalle del usuario...</div>

      <div v-else-if="selectedUser" class="double-grid">
        <div class="empty-state">
          <h3>{{ selectedUser.name }}</h3>
          <p>{{ selectedUser.email }}</p>
          <p>ID: <span class="mono">{{ selectedUser.id }}</span></p>
          
          <p>Telefono: {{ selectedUser.phone || 'Sin telefono' }}</p>
          <p>Estado: {{ selectedUser.isActive ? 'Activo' : 'Inactivo' }}</p>
          <p>Ultimo login: {{ formatDateTime(selectedUser.lastLoginAt) }}</p>
          <p>Creado: {{ formatDate(selectedUser.createdAt) }}</p>
          <p>Roles: {{ selectedUser.roles?.map((assignment) => assignment.role).filter(Boolean).join(', ') || 'Sin roles asignados' }}</p>
        </div>

        <form class="form-grid" @submit.prevent="updateUser">
          <div class="field-grid">
            <label class="field">
              <span>Nombre</span>
              <input v-model.trim="editForm.name" type="text" required />
            </label>

            <label class="field">
              <span>Email</span>
              <input v-model.trim="editForm.email" type="email" required />
            </label>
          </div>

          <div class="field-grid">
            <label class="field">
              <span>Telefono</span>
              <input v-model.trim="editForm.phone" type="text" placeholder="Telefono opcional" />
            </label>

            <label class="field">
              <span>Nueva password</span>
              <input
                v-model="editForm.password"
                type="password"
                minlength="6"
                placeholder="Solo si necesitas cambiarla"
              />
            </label>
          </div>

          <label class="field">
            <span>Estado</span>
            <select v-model="editForm.isActive">
              <option :value="true">Activo</option>
              <option :value="false">Inactivo</option>
            </select>
          </label>

          <p class="helper-line">
            Nota: el endpoint de actualizacion no expone reasignacion de roles. Si necesitas otro
            alcance, hoy toca resolverlo desde backend.
          </p>

          <div class="toolbar">
            <button class="button button--primary" type="submit" :disabled="updatingUser">
              {{ updatingUser ? 'Guardando...' : 'Guardar cambios' }}
            </button>
            <button class="button button--danger" type="button" :disabled="removingUser" @click="deleteUser">
              {{ removingUser ? 'Eliminando...' : 'Eliminar usuario' }}
            </button>
          </div>
        </form>
      </div>

      <div v-else class="empty-state">
        <h3>Sin usuario seleccionado</h3>
        <p>Selecciona un tenant y luego un registro de la tabla superior para cargar su detalle.</p>
      </div>
    </SectionCard>
  </div>
</template>
