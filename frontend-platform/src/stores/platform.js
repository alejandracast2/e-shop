import { defineStore } from 'pinia'
import { apiRequest } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const replaceById = (items, nextItem) => {
  const filtered = items.filter((item) => item.id !== nextItem.id)
  return [nextItem, ...filtered]
}

export const usePlatformStore = defineStore('platform', {
  state: () => ({
    tenants: [],
    users: [],
    userDetailsById: {},
    storesByTenant: {},
    loadingTenants: false,
    loadingUsers: false,
    loadingDashboard: false,
    loadingStoresByTenant: {},
    tenantsLoaded: false,
    usersLoaded: false,
  }),
  getters: {
    totalStores: (state) =>
      Object.values(state.storesByTenant).reduce(
        (count, stores) => count + (Array.isArray(stores) ? stores.length : 0),
        0,
      ),
    activeUsers: (state) => state.users.filter((user) => user.isActive).length,
    storesForTenant: (state) => (tenantId) => state.storesByTenant[tenantId] || [],
  },
  actions: {
    async authorizedRequest(path, options = {}) {
      const auth = useAuthStore()
      auth.hydrate()

      if (!auth.token) {
        throw new Error('Tu sesion ya no es valida. Vuelve a iniciar sesion.')
      }

      return apiRequest(path, {
        ...options,
        token: auth.token,
      })
    },
    async fetchTenants(force = false) {
      if (this.tenantsLoaded && !force) {
        return this.tenants
      }

      this.loadingTenants = true
      try {
        const payload = await this.authorizedRequest('/platform/tenants')
        this.tenants = Array.isArray(payload) ? payload : []
        this.tenantsLoaded = true
        return this.tenants
      } finally {
        this.loadingTenants = false
      }
    },
    async createTenant(payload) {
      const tenant = await this.authorizedRequest('/platform/tenants', {
        method: 'POST',
        body: payload,
      })
      this.tenants = replaceById(this.tenants, tenant)
      this.tenantsLoaded = true
      return tenant
    },
    async fetchStores(tenantId, force = false) {
      if (this.storesByTenant[tenantId] && !force) {
        return this.storesByTenant[tenantId]
      }

      this.loadingStoresByTenant = {
        ...this.loadingStoresByTenant,
        [tenantId]: true,
      }

      try {
        const payload = await this.authorizedRequest(`/platform/tenants/${tenantId}/stores`)
        this.storesByTenant = {
          ...this.storesByTenant,
          [tenantId]: Array.isArray(payload) ? payload : [],
        }
        return this.storesByTenant[tenantId]
      } finally {
        this.loadingStoresByTenant = {
          ...this.loadingStoresByTenant,
          [tenantId]: false,
        }
      }
    },
    async createStore(tenantId, payload) {
      const store = await this.authorizedRequest(`/platform/tenants/${tenantId}/stores`, {
        method: 'POST',
        body: payload,
      })
      const currentStores = this.storesByTenant[tenantId] || []
      this.storesByTenant = {
        ...this.storesByTenant,
        [tenantId]: replaceById(currentStores, store),
      }
      return store
    },
    async fetchUsers(force = false) {
      if (this.usersLoaded && !force) {
        return this.users
      }

      this.loadingUsers = true
      try {
        const payload = await this.authorizedRequest('/users')
        this.users = Array.isArray(payload) ? payload : []
        this.userDetailsById = this.users.reduce(
          (accumulator, user) => ({
            ...accumulator,
            [user.id]: user,
          }),
          {},
        )
        this.usersLoaded = true
        return this.users
      } finally {
        this.loadingUsers = false
      }
    },
    async fetchUser(userId, force = false) {
      if (this.userDetailsById[userId] && !force) {
        return this.userDetailsById[userId]
      }

      const payload = await this.authorizedRequest(`/users/${userId}`)
      this.userDetailsById = {
        ...this.userDetailsById,
        [userId]: payload,
      }
      this.users = replaceById(this.users, payload)
      this.usersLoaded = true
      return payload
    },
    async createUser(payload) {
      const user = await this.authorizedRequest('/users', {
        method: 'POST',
        body: payload,
      })
      this.users = replaceById(this.users, user)
      this.userDetailsById = {
        ...this.userDetailsById,
        [user.id]: user,
      }
      this.usersLoaded = true
      return user
    },
    async updateUser(userId, payload) {
      const user = await this.authorizedRequest(`/users/${userId}`, {
        method: 'PATCH',
        body: payload,
      })
      this.users = replaceById(this.users, user)
      this.userDetailsById = {
        ...this.userDetailsById,
        [user.id]: user,
      }
      return user
    },
    async deleteUser(userId) {
      await this.authorizedRequest(`/users/${userId}`, {
        method: 'DELETE',
      })
      this.users = this.users.filter((user) => user.id !== userId)
      const nextDetails = { ...this.userDetailsById }
      delete nextDetails[userId]
      this.userDetailsById = nextDetails
    },
    async loadDashboard() {
      this.loadingDashboard = true
      try {
        await Promise.all([this.fetchTenants(true), this.fetchUsers(true)])
        await Promise.all(this.tenants.map((tenant) => this.fetchStores(tenant.id, true)))
      } finally {
        this.loadingDashboard = false
      }
    },
  },
})
