import { defineStore } from 'pinia'
import { apiRequest, DEFAULT_STORE_SLUG } from '@/lib/api'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'

const STORE_KEY_PREFIX = 'eshop-admin-store'

export const useAdminStore = defineStore('admin-context', {
  state: () => ({
    selectedStore: null,
    availableStores: [],
    loadingStores: false,
    storeError: '',
    hydratedSelectionFor: null,
  }),
  getters: {
    tenantId() {
      const auth = useAuthStore(pinia)
      return auth.user?.roles?.find((assignment) => assignment.tenantId)?.tenantId || null
    },
    assignedStoreId() {
      const auth = useAuthStore(pinia)
      return auth.user?.roles?.find((assignment) => assignment.storeId)?.storeId || null
    },
    selectionKey() {
      const auth = useAuthStore(pinia)
      return auth.user ? `${STORE_KEY_PREFIX}:${auth.user.id}` : null
    },
    requestScopeKey() {
      return [
        this.tenantId || '',
        this.selectedStore?.id || '',
        this.selectedStore?.slug || '',
      ].join(':')
    },
    activeStoreLabel() {
      return this.selectedStore?.name || this.selectedStore?.slug || 'Store activa'
    },
  },
  actions: {
    hydrateSelection() {
      if (typeof window === 'undefined') return
      if (!this.selectionKey || this.hydratedSelectionFor === this.selectionKey) return

      this.hydratedSelectionFor = this.selectionKey
      const stored = window.localStorage.getItem(this.selectionKey)

      if (!stored) return

      try {
        this.selectedStore = JSON.parse(stored)
      } catch {
        this.selectedStore = null
        window.localStorage.removeItem(this.selectionKey)
      }
    },
    persistSelection() {
      if (typeof window === 'undefined' || !this.selectionKey) return

      if (this.selectedStore) {
        window.localStorage.setItem(this.selectionKey, JSON.stringify(this.selectedStore))
      } else {
        window.localStorage.removeItem(this.selectionKey)
      }
    },
    setSelectedStore(store) {
      this.selectedStore = store
      this.persistSelection()
    },
    buildContextHeaders(options = {}) {
      const { includeTenant = true, includeStore = true } = options
      const headers = {}

      if (includeTenant && this.tenantId) {
        headers['x-tenant-id'] = this.tenantId
      }

      if (includeStore) {
        if (this.selectedStore?.id) {
          headers['x-store-id'] = this.selectedStore.id
        } else if (this.selectedStore?.slug) {
          headers['x-store-slug'] = this.selectedStore.slug
        } else if (!this.tenantId && DEFAULT_STORE_SLUG) {
          headers['x-store-slug'] = DEFAULT_STORE_SLUG
        }
      }

      return headers
    },
    async authorizedRequest(path, options = {}) {
      const auth = useAuthStore(pinia)
      const { headers = {}, contextOptions, ...requestOptions } = options

      return apiRequest(path, {
        ...requestOptions,
        token: auth.token,
        headers: {
          ...this.buildContextHeaders(contextOptions),
          ...headers,
        },
      })
    },
    async refreshStores() {
      const auth = useAuthStore(pinia)

      if (!auth.token || !this.tenantId) {
        this.availableStores = []
        return []
      }

      this.loadingStores = true
      this.storeError = ''

      try {
        const stores = await this.authorizedRequest('/admin/stores', {
          contextOptions: { includeStore: false },
        })

        this.availableStores = Array.isArray(stores) ? stores : []

        if (this.selectedStore?.id) {
          const matchingStore = this.availableStores.find((store) => store.id === this.selectedStore?.id)
          if (matchingStore) {
            this.setSelectedStore(matchingStore)
          }
        }

        return this.availableStores
      } catch (error) {
        this.availableStores = []
        this.storeError = 'No se pudo cargar la store.'
        throw error
      } finally {
        this.loadingStores = false
      }
    },
    async ensureStoreContext() {
      const auth = useAuthStore(pinia)
      auth.hydrate()
      this.hydrateSelection()

      if (!auth.token || !auth.user) {
        return
      }

      if (
        this.selectedStore?.tenantId &&
        this.tenantId &&
        this.selectedStore.tenantId !== this.tenantId
      ) {
        this.setSelectedStore(null)
      }

      if (this.assignedStoreId) {
        if (this.selectedStore?.id !== this.assignedStoreId) {
          this.setSelectedStore({
            id: this.assignedStoreId,
            name: this.selectedStore?.name || 'Store actual',
            slug: this.selectedStore?.slug || '',
            tenantId: this.tenantId || '',
          })
        }

        await this.refreshStores().catch(() => [])
        return
      }

      if (this.selectedStore?.id && this.selectedStore?.tenantId === this.tenantId) {
        return
      }

      const stores = await this.refreshStores().catch(() => [])
      const preferredStore =
        stores.find((store) => store.id === this.selectedStore?.id) ||
        (DEFAULT_STORE_SLUG ? stores.find((store) => store.slug === DEFAULT_STORE_SLUG) : null) ||
        stores[0]

      if (preferredStore) {
        this.setSelectedStore(preferredStore)
      }
    },
    async switchStore(storeId) {
      if (!storeId) return

      const currentStore = this.availableStores.find((store) => store.id === storeId)
      if (currentStore) {
        this.setSelectedStore(currentStore)
        return
      }

      const stores = await this.refreshStores().catch(() => [])
      const nextStore = stores.find((store) => store.id === storeId) || null

      if (nextStore) {
        this.setSelectedStore(nextStore)
      }
    },
    clearContext() {
      if (typeof window !== 'undefined' && this.selectionKey) {
        window.localStorage.removeItem(this.selectionKey)
      }

      this.selectedStore = null
      this.availableStores = []
      this.loadingStores = false
      this.storeError = ''
      this.hydratedSelectionFor = null
    },
  },
})
