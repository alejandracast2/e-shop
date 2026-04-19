<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const auth = useAuthStore()
const admin = useAdminStore()

const dateLabel = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
}).format(new Date())

const selectedStoreId = computed({
  get: () => admin.selectedStore?.id || '',
  set: (value) => {
    void admin.switchStore(value)
  },
})

const canPickStore = computed(() => auth.canSwitchStores && admin.availableStores.length > 1)

const logout = async () => {
  admin.clearContext()
  auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-status">
      <span class="pill">Estado: estable</span>
      <span v-if="admin.storeError" class="pill pill--warn">{{ admin.storeError }}</span>
    </div>

    <div class="topbar-actions">
      <label v-if="canPickStore" class="store-picker">
        <span class="muted">Store</span>
        <select v-model="selectedStoreId" :disabled="admin.loadingStores">
          <option value="" disabled>Selecciona una store</option>
          <option v-for="store in admin.availableStores" :key="store.id" :value="store.id">
            {{ store.name }}
          </option>
        </select>
      </label>

      <span v-else-if="admin.selectedStore" class="pill">{{ admin.activeStoreLabel }}</span>

      <span class="muted">{{ dateLabel }}</span>
      <span class="pill">{{ auth.displayName }}</span>

      <RouterLink class="btn btn-primary" :to="{ name: 'product-create' }">
        Nuevo producto
      </RouterLink>
      <button class="btn btn-ghost" type="button" @click="logout">Salir</button>
    </div>
  </header>
</template>
