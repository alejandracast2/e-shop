import { defineStore } from 'pinia'
import { apiRequest } from '@/lib/api'

const STORAGE_KEY = 'eshop-platform-session'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    hydrated: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isPlatformAdmin: (state) =>
      Boolean(state.user?.roles?.some((assignment) => assignment.role === 'platform_admin')),
  },
  actions: {
    hydrate() {
      if (this.hydrated) return
      this.hydrated = true

      if (typeof window === 'undefined') return

      const rawSession = window.localStorage.getItem(STORAGE_KEY)
      if (!rawSession) return

      try {
        const parsed = JSON.parse(rawSession)
        this.token = parsed.token || null
        this.user = parsed.user || null
      } catch {
        this.clearStorage()
      }
    },
    persist() {
      if (typeof window === 'undefined') return

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: this.token,
          user: this.user,
        }),
      )
    },
    clearStorage() {
      if (typeof window === 'undefined') return
      window.localStorage.removeItem(STORAGE_KEY)
    },
    async login(credentials) {
      const payload = await apiRequest('/auth/login', {
        method: 'POST',
        body: credentials,
      })

      const hasPlatformRole = payload?.user?.roles?.some(
        (assignment) => assignment.role === 'platform_admin',
      )

      if (!hasPlatformRole) {
        this.logout()
        throw new Error('Este frontend solo permite acceso a usuarios con rol platform_admin.')
      }

      this.token = payload.accessToken
      this.user = payload.user
      this.hydrated = true
      this.persist()

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
