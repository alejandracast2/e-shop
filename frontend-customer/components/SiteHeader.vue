<template>
  <header class="header">
    <div class="container header-inner">
      <NuxtLink to="/" class="brand">
        <span class="brand-mark">E</span>
        <div>
          <div class="brand-title">E-Shop Atelier</div>
          <div class="brand-subtitle">Curated everyday essentials</div>
        </div>
      </NuxtLink>
      <nav class="nav">
        <NuxtLink to="/">Inicio</NuxtLink>
        <NuxtLink to="/cart">Carrito</NuxtLink>
        <NuxtLink to="/checkout">Checkout</NuxtLink>
        <NuxtLink to="/orders">Pedidos</NuxtLink>
      </nav>
      <NuxtLink to="/cart" class="cart">
        <span>Carrito</span>
        <span class="cart-count">{{ itemCount }}</span>
      </NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
const { itemCount } = useCart();
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(246, 241, 234, 0.9);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(214, 75, 42, 0.12);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-family: 'Fraunces', serif;
}

.brand-title {
  font-family: 'Fraunces', serif;
  font-size: 18px;
}

.brand-subtitle {
  font-size: 12px;
  color: var(--muted);
}

.nav {
  display: flex;
  gap: 18px;
  font-weight: 600;
  color: var(--muted);
}

.nav a:hover {
  color: var(--text);
}

.cart {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--outline);
  font-weight: 600;
}

.cart-count {
  background: var(--accent);
  color: #fff;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
}

@media (max-width: 720px) {
  .nav {
    display: none;
  }
}
</style>
