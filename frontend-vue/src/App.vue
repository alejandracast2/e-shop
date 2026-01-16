<script setup>
import { useStore } from './store';
import BrandMark from './components/BrandMark.vue';

const store = useStore();
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div class="brand">
        <BrandMark />
        <div>
          <div class="brand-title">Threadline</div>
          <div class="brand-sub">atelier</div>
        </div>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-link">Inicio</router-link>
        <router-link to="/products" class="nav-link">Productos</router-link>
        <router-link to="/cart" class="nav-link">Carrito</router-link>
      </nav>
      <router-link class="cart-pill" to="/cart">
        Cart ({{ store.cartCount }})
      </router-link>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      <div>Threadline Atelier 2026</div>
      <div>Slow craft. Modern lines.</div>
    </footer>
  </div>
</template>
