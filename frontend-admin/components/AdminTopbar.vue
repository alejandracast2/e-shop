<template>
  <header class="topbar">
    <div>
      <div class="pill">Estado: estable</div>
    </div>
    <div class="topbar-actions">
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
const { user, clearAuth } = useAuth();

const logout = async () => {
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
