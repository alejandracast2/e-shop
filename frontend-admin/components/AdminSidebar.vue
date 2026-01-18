<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">A</div>
      <div>
        <div class="brand-title">E-Shop Admin</div>
        <div class="brand-subtitle">Panel de control</div>
      </div>
    </div>
    <nav class="nav">
      <NuxtLink to="/" :class="{ active: isActive('/') }">Dashboard</NuxtLink>
      <NuxtLink to="/products" :class="{ active: isActive('/products') }">Productos</NuxtLink>
      <NuxtLink to="/categories" :class="{ active: isActive('/categories') }">
        Categorias
      </NuxtLink>
      <NuxtLink to="/attributes" :class="{ active: isActive('/attributes') }">
        Atributos
      </NuxtLink>
      <NuxtLink to="/product-types" :class="{ active: isActive('/product-types') }">
        Tipos de producto
      </NuxtLink>
      <NuxtLink to="/orders" :class="{ active: isActive('/orders') }">Pedidos</NuxtLink>
      <NuxtLink to="/payments" :class="{ active: isActive('/payments') }">
        Pagos
      </NuxtLink>
      <NuxtLink to="/customers" :class="{ active: isActive('/customers') }">Clientes</NuxtLink>
    </nav>
    <div class="sidebar-footer">
      <span class="pill">API conectada</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute();
const isActive = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path === path || route.path.startsWith(`${path}/`);
};
</script>

<style scoped>
.sidebar {
  padding: 32px 24px;
  border-right: 1px solid var(--outline);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
}

.brand-title {
  font-family: 'Unbounded', sans-serif;
  font-size: 16px;
}

.brand-subtitle {
  font-size: 12px;
  color: var(--muted);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav a {
  padding: 10px 14px;
  border-radius: 12px;
  color: var(--muted);
  font-weight: 600;
}

.nav a.active {
  color: var(--text);
  background: var(--surface-muted);
}

.sidebar-footer {
  margin-top: auto;
}

@media (max-width: 900px) {
  .sidebar {
    flex-direction: row;
    align-items: center;
    overflow-x: auto;
  }

  .nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
