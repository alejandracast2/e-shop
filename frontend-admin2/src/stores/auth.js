import { defineStore } from 'pinia'
import { apiRequest } from '@/lib/api'

const TOKEN_KEY = 'eshop-admin-token'
const USER_KEY = 'eshop-admin-user'

const ADMIN_ROLES = ['tenant_owner', 'store_admin', 'store_staff']
const MANAGER_ROLES = ['tenant_owner', 'store_admin']

export const useAuthStore = defineStore('admin-auth', {
  state: () => ({
    token: null,
    user: null,
    hydrated: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    roleNames: (state) =>
      Array.isArray(state.user?.roles)
        ? [...new Set(state.user.roles.map((assignment) => assignment.role).filter(Boolean))]
        : [],
    hasAdminAccess() {
      return this.roleNames.some((role) => ADMIN_ROLES.includes(role))
    },
    canManageInventory() {
      return this.roleNames.some((role) => MANAGER_ROLES.includes(role))
    },
    canModeratePayments() {
      return this.canManageInventory
    },
    canUpdateOrders() {
      return this.canManageInventory
    },
    canSwitchStores() {
      return this.roleNames.some((role) => MANAGER_ROLES.includes(role))
    },
    displayName: (state) => state.user?.name || state.user?.email || 'Admin',
  },
  actions: {
    hydrate() {
      if (this.hydrated) return
      this.hydrated = true

      if (typeof window === 'undefined') return

      const storedToken = window.localStorage.getItem(TOKEN_KEY)
      const storedUser = window.localStorage.getItem(USER_KEY)

      if (storedToken) {
        this.token = storedToken
      }

      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser)
        } catch {
          this.clearStorage()
        }
      }
    },
    persist() {
      if (typeof window === 'undefined') return

      if (this.token) {
        window.localStorage.setItem(TOKEN_KEY, this.token)
      } else {
        window.localStorage.removeItem(TOKEN_KEY)
      }

      if (this.user) {
        window.localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      } else {
        window.localStorage.removeItem(USER_KEY)
      }
    },
    clearStorage() {
      if (typeof window === 'undefined') return
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem(USER_KEY)
    },
    setSession(token, user) {
      this.token = token
      this.user = user
      this.hydrated = true
      this.persist()
    },
    async login(credentials) {
      const payload = await apiRequest('/auth/login', {
        method: 'POST',
        body: credentials,
      })

      const hasAdminRole = payload?.user?.roles?.some((assignment) =>
        ADMIN_ROLES.includes(assignment.role),
      )

      if (!hasAdminRole) {
        this.logout()
        throw new Error(
          'Este frontend solo permite acceso a usuarios tenant_owner, store_admin o store_staff.',
        )
      }

      this.setSession(payload.accessToken, payload.user)
      return payload
    },
    logout() {
      this.token = null
      this.user = null
      this.hydrated = true
      this.clearStorage()
    },
  },
})
