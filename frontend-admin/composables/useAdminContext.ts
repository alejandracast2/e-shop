import type { StoreSummary } from '~/types';

const STORE_KEY_PREFIX = 'eshop-admin-store';

export const useAdminContext = () => {
  const config = useRuntimeConfig();
  const { authHeaders, hydrate, token, user } = useAuth();
  const selectedStore = useState<StoreSummary | null>('admin-selected-store', () => null);
  const availableStores = useState<StoreSummary[]>('admin-available-stores', () => []);
  const loadingStores = useState<boolean>('admin-loading-stores', () => false);
  const storeError = useState<string>('admin-store-error', () => '');

  const tenantId = computed(
    () => user.value?.roles?.find((assignment) => assignment.tenantId)?.tenantId ?? null,
  );
  const assignedStoreId = computed(
    () => user.value?.roles?.find((assignment) => assignment.storeId)?.storeId ?? null,
  );
  const selectionKey = computed(() =>
    user.value ? `${STORE_KEY_PREFIX}:${user.value.id}` : null,
  );

  const persistSelection = () => {
    if (!process.client || !selectionKey.value) return;

    if (selectedStore.value) {
      window.localStorage.setItem(selectionKey.value, JSON.stringify(selectedStore.value));
    } else {
      window.localStorage.removeItem(selectionKey.value);
    }
  };

  const loadPersistedSelection = () => {
    if (!process.client || !selectionKey.value) return;

    const stored = window.localStorage.getItem(selectionKey.value);
    if (!stored) return;

    try {
      selectedStore.value = JSON.parse(stored) as StoreSummary;
    } catch {
      selectedStore.value = null;
      window.localStorage.removeItem(selectionKey.value);
    }
  };

  const setSelectedStore = (store: StoreSummary | null) => {
    selectedStore.value = store;
    persistSelection();
  };

  const refreshStores = async () => {
    if (!token.value || !tenantId.value) {
      availableStores.value = [];
      return [];
    }

    loadingStores.value = true;
    storeError.value = '';

    try {
      const stores = await $fetch<StoreSummary[]>('/admin/stores', {
        baseURL: config.public.apiUrl,
        headers: {
          ...authHeaders.value,
          'x-tenant-id': tenantId.value,
        },
      });

      availableStores.value = stores ?? [];

      if (selectedStore.value?.id) {
        const matchingStore = availableStores.value.find((store) => store.id === selectedStore.value?.id);
        if (matchingStore) {
          setSelectedStore(matchingStore);
        }
      }

      return availableStores.value;
    } catch {
      availableStores.value = [];
      storeError.value = 'No se pudo cargar la store.';
      throw new Error('store-fetch-failed');
    } finally {
      loadingStores.value = false;
    }
  };

  const ensureStoreContext = async () => {
    hydrate();
    loadPersistedSelection();

    if (!token.value || !user.value) {
      return;
    }

    if (selectedStore.value?.tenantId && tenantId.value && selectedStore.value.tenantId !== tenantId.value) {
      setSelectedStore(null);
    }

    if (assignedStoreId.value) {
      if (selectedStore.value?.id !== assignedStoreId.value) {
        setSelectedStore({
          id: assignedStoreId.value,
          name: selectedStore.value?.name ?? 'Store actual',
          slug: selectedStore.value?.slug ?? '',
          tenantId: tenantId.value ?? '',
        });
      }

      void refreshStores().catch(() => undefined);
      return;
    }

    if (selectedStore.value?.id && selectedStore.value.tenantId === tenantId.value) {
      return;
    }

    const stores = await refreshStores().catch(() => []);
    const preferredStore =
      stores.find((store) => store.id === selectedStore.value?.id) ??
      (config.public.storeSlug
        ? stores.find((store) => store.slug === config.public.storeSlug)
        : undefined) ??
      stores[0];

    if (preferredStore) {
      setSelectedStore(preferredStore);
    }
  };

  const switchStore = async (storeId: string) => {
    if (!storeId) return;

    const matchingStore = availableStores.value.find((store) => store.id === storeId);
    if (matchingStore) {
      setSelectedStore(matchingStore);
      return;
    }

    const stores = await refreshStores().catch(() => []);
    const nextStore = stores.find((store) => store.id === storeId) ?? null;
    if (nextStore) {
      setSelectedStore(nextStore);
    }
  };

  const clearContext = () => {
    if (process.client && selectionKey.value) {
      window.localStorage.removeItem(selectionKey.value);
    }
    selectedStore.value = null;
    availableStores.value = [];
    storeError.value = '';
  };

  const apiHeaders = computed<Record<string, string>>(() => {
    const headers: Record<string, string> = {
      ...authHeaders.value,
    };

    if (tenantId.value) {
      headers['x-tenant-id'] = tenantId.value;
    }

    if (selectedStore.value?.id) {
      headers['x-store-id'] = selectedStore.value.id;
    } else if (selectedStore.value?.slug) {
      headers['x-store-slug'] = selectedStore.value.slug;
    } else if (!tenantId.value && config.public.storeSlug) {
      headers['x-store-slug'] = config.public.storeSlug;
    }

    return headers;
  });

  return {
    apiHeaders,
    availableStores,
    clearContext,
    ensureStoreContext,
    loadingStores,
    refreshStores,
    selectedStore,
    storeError,
    switchStore,
    tenantId,
  };
};
