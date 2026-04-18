<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const navItems = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    hint: 'Resumen',
  },
  {
    name: 'tenants',
    label: 'Tenants',
    hint: 'Tenants y stores',
  },
  {
    name: 'users',
    label: 'Usuarios',
    hint: 'CRUD platform_admin',
  },
  {
    name: 'endpoints',
    label: 'Endpoints',
    hint: 'Mapa operativo',
  },
]

const pageTitle = computed(() => route.meta.title ?? 'Platform Dashboard')
const userRoles = computed(() =>
  auth.user?.roles?.map((assignment) => assignment.role).join(', ') || 'Sin roles',
)

const handleLogout = () => {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="sidebar-brand">
        <p class="sidebar-brand__eyebrow">E-Shop Platform</p>
        <h1 class="sidebar-brand__title">Control Center</h1>
        <p class="sidebar-brand__copy">
          Interfaz enfocada en operaciones de plataforma para usuarios con rol
          <span class="mono">platform_admin</span>.
        </p>
      </div>

      <nav class="nav-list" aria-label="Navegacion principal">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          class="nav-item"
          :to="{ name: item.name }"
        >
          <span>{{ item.label }}</span>
          <span class="nav-item__hint">{{ item.hint }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div>
          <strong>{{ auth.user?.name || 'Usuario' }}</strong>
          <p>{{ auth.user?.email || 'sin email' }}</p>
        </div>
        <p>Roles activos: {{ userRoles }}</p>
      </div>
    </aside>

    <div class="app-content">
      <header class="topbar">
        <div class="stack-sm">
          <p class="eyebrow">Platform administration</p>
          <h2 class="page-title">{{ pageTitle }}</h2>
          <p class="muted">
            Operaciones reales sobre tenants, stores y usuarios usando los endpoints
            protegidos del backend.
          </p>
        </div>

        <div class="topbar-summary">
          <div class="topbar-chip">
            <strong>API base</strong>
            <p class="mono">{{ API_BASE_URL }}</p>
          </div>
          <div class="topbar-chip">
            <strong>Rol esperado</strong>
            <p class="mono">platform_admin</p>
          </div>
          <button class="button button--ghost" type="button" @click="handleLogout">
            Cerrar sesion
          </button>
        </div>
      </header>

      <main class="app-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>
