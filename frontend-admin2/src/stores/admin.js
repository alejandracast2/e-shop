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
    storesLoadedForTenant: null,
    refreshStoresPromise: null,
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
    async refreshStores(options = {}) {
      const auth = useAuthStore(pinia)
      const { force = false } = options

      if (!auth.token || !this.tenantId) {
        this.availableStores = []
        this.storesLoadedForTenant = null
        return []
      }

      if (!auth.canSwitchStores) {
        this.availableStores = this.selectedStore?.id ? [this.selectedStore] : []
        this.storeError = ''
        this.storesLoadedForTenant = this.tenantId
        return this.availableStores
      }

      if (!force && this.storesLoadedForTenant === this.tenantId) {
        return this.availableStores
      }

      // Reuse the in-flight fetch so login, router guards, and mounted hooks do not duplicate it.
      if (this.refreshStoresPromise) {
        return this.refreshStoresPromise
      }

      const tenantId = this.tenantId
      this.loadingStores = true
      this.storeError = ''

      this.refreshStoresPromise = this.authorizedRequest('/admin/stores', {
          contextOptions: { includeStore: false },
        })
        .then((stores) => {
          if (tenantId !== this.tenantId) {
            return this.availableStores
          }

          this.availableStores = Array.isArray(stores) ? stores : []
          this.storesLoadedForTenant = tenantId

          if (this.selectedStore?.id) {
            const matchingStore = this.availableStores.find(
              (store) => store.id === this.selectedStore?.id,
            )
            if (matchingStore) {
              this.setSelectedStore(matchingStore)
            }
          }

          return this.availableStores
        })
        .catch((error) => {
          if (tenantId === this.tenantId) {
            this.availableStores = []
            this.storesLoadedForTenant = null
            this.storeError = 'No se pudo cargar la store.'
          }
          throw error
        })
        .finally(() => {
          this.loadingStores = false
          this.refreshStoresPromise = null
        })

      return this.refreshStoresPromise
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
        this.availableStores = []
        this.storesLoadedForTenant = null
      }

      if (this.assignedStoreId) {
        if (this.selectedStore?.id !== this.assignedStoreId) {
          const matchingStore = this.availableStores.find((store) => store.id === this.assignedStoreId)
          this.setSelectedStore({
            ...(matchingStore ?? {}),
            id: this.assignedStoreId,
            name: matchingStore?.name || this.selectedStore?.name || 'Store actual',
            slug: matchingStore?.slug || this.selectedStore?.slug || '',
            tenantId: matchingStore?.tenantId || this.tenantId || '',
          })
        }
      }

      const hasSelectedStore =
        Boolean(this.selectedStore?.id) &&
        this.selectedStore?.tenantId === this.tenantId &&
        (!this.assignedStoreId || this.selectedStore.id === this.assignedStoreId)

      if (!auth.canSwitchStores) {
        this.availableStores = hasSelectedStore ? [this.selectedStore] : []
        this.storesLoadedForTenant = this.tenantId
        return
      }

      if (hasSelectedStore && this.storesLoadedForTenant === this.tenantId) {
        return
      }

      const stores = await this.refreshStores().catch(() => [])
      const preferredStore =
        stores.find((store) => store.id === (this.assignedStoreId || this.selectedStore?.id)) ||
        (DEFAULT_STORE_SLUG ? stores.find((store) => store.slug === DEFAULT_STORE_SLUG) : null) ||
        stores[0]

      if (
        preferredStore &&
        (
          this.selectedStore?.id !== preferredStore.id ||
          this.selectedStore?.name !== preferredStore.name ||
          this.selectedStore?.slug !== preferredStore.slug ||
          this.selectedStore?.tenantId !== preferredStore.tenantId
        )
      ) {
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
      this.storesLoadedForTenant = null
      this.refreshStoresPromise = null
    },
  },
})
