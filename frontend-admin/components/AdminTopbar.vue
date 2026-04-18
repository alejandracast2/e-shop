<template>
  <header class="topbar">
    <div>
      <div class="pill">Estado: estable</div>
    </div>
    <div class="topbar-actions">
      <label v-if="availableStores.length > 1" class="store-picker">
        <span class="muted">Store</span>
        <select v-model="selectedStoreId" :disabled="loadingStores">
          <option value="" disabled>Selecciona una store</option>
          <option v-for="store in availableStores" :key="store.id" :value="store.id">
            {{ store.name }}
          </option>
        </select>
      </label>
      <span v-else-if="selectedStore" class="pill">
        {{ selectedStore.name || selectedStore.slug || 'Store activa' }}
      </span>
      <span class="muted">{{ dateLabel }}</span>
      <span v-if="user" class="pill">{{ user.name }}</span>
      <button class="btn btn-ghost" type="button" @click="logout">Salir</button>
      <NuxtLink class="btn btn-primary" to="/products/new">Nuevo producto</NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
const dateLabel = new Date().toLocaleDateString('es-MX', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const router = useRouter();
const route = useRoute();
const { user, clearAuth } = useAuth();
const { availableStores, clearContext, loadingStores, refreshStores, selectedStore, switchStore } =
  useAdminContext();

const updateStore = async (value: string) => {
  if (!value || value === selectedStore.value?.id) {
    return;
  }
  await switchStore(value);
  if (process.client) {
    window.location.assign(route.fullPath);
  }
};

const selectedStoreId = computed({
  get: () => selectedStore.value?.id ?? '',
  set: (value: string) => {
    void updateStore(value);
  },
});

onMounted(() => {
  void refreshStores().catch(() => undefined);
});

const logout = async () => {
  clearContext();
  clearAuth();
  await router.push('/login');
};
</script>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 36px;
  border-bottom: 1px solid var(--outline);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.store-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.store-picker select {
  border: 1px solid var(--outline);
  border-radius: 999px;
  padding: 8px 12px;
  background: #fff;
  font: inherit;
}

@media (max-width: 900px) {
  .topbar {
    padding: 16px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
