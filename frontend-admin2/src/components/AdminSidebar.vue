<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Productos', to: '/products' },
  { label: 'Categorias', to: '/categories' },
  { label: 'Atributos', to: '/attributes' },
  { label: 'Tipos', to: '/product-types' },
  { label: 'Pedidos', to: '/orders' },
  { label: 'Pagos', to: '/payments' },
  { label: 'Clientes', to: '/customers' },
]

const activePath = computed(() => route.path)

const isActive = (path) => {
  if (path === '/') return activePath.value === '/'
  return activePath.value === path || activePath.value.startsWith(`${path}/`)
}
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">EA</div>
      <div>
        <strong class="brand-title">E-Shop Admin</strong>
        <div class="muted brand-subtitle">Vue control panel</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar-link"
        :class="{ 'sidebar-link--active': isActive(item.to) }"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <span class="pill">Vue + Vite</span>
      <span class="muted sidebar-note">Mismo backend admin, sin Nuxt.</span>
    </div>
  </aside>
</template>
