<script setup>
import { useStore } from './store';
import BrandMark from './components/BrandMark.vue';

const store = useStore();
</script>

<template>
  <div class="page">
    <header class="site-header">
      <div class="promo-bar">
        <div class="promo-inner">ENVIO GRATIS a toda COLOMBIA desde $199.000</div>
      </div>
      <div class="header-main">
        <div class="brand">
          <BrandMark />
          <div>
            <div class="brand-title">Threadline</div>
            <div class="brand-sub">atelier</div>
          </div>
        </div>
        <nav class="nav">
          <router-link to="/" class="nav-link">Inicio</router-link>
          <router-link :to="{ path: '/products', query: { categoria: 'mujer' } }" class="nav-link">Mujer</router-link>
          <router-link :to="{ path: '/products', query: { categoria: 'hombre' } }" class="nav-link">Hombre</router-link>
        </nav>
        <div class="top-actions">
          <button class="icon-btn cart-btn" type="button" aria-label="Cart" @click="store.openCart">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="20" r="1.6"></circle>
              <circle cx="17" cy="20" r="1.6"></circle>
              <path d="M3 4h2l2.2 10.5a2 2 0 0 0 2 1.5h7.5a2 2 0 0 0 2-1.5L21 7H6.2"></path>
            </svg>
            <span class="cart-badge">{{ store.cartCount }}</span>
          </button>
        </div>
      </div>
    </header>

    <main class="main">
      <router-view />
    </main>

    <div class="cart-drawer" :class="{ open: store.state.cartOpen }">
      <button
        class="drawer-backdrop"
        type="button"
        aria-label="Close cart drawer"
        @click="store.closeCart"
      ></button>
      <aside class="drawer-panel" aria-label="Cart preview">
        <div class="drawer-header">
          <div>
            <p class="section-kicker">Carrito de compra</p>
            <h3>Items ({{ store.cartCount }})</h3>
          </div>
          <button class="icon-btn" type="button" aria-label="Close cart" @click="store.closeCart">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line x1="5" y1="5" x2="19" y2="19"></line>
              <line x1="19" y1="5" x2="5" y2="19"></line>
            </svg>
          </button>
        </div>

        <div v-if="store.state.cart.length === 0" class="notice">
          Cart is empty. Add pieces from the products page.
        </div>

        <div v-else class="drawer-list">
          <div v-for="item in store.state.cart" :key="item.product.id" class="drawer-item">
            <div class="drawer-thumb">
              <img v-if="item.product.imageUrl" :src="item.product.imageUrl" :alt="item.product.name" />
              <span v-else>THREADLINE</span>
            </div>
            <div class="drawer-info">
              <strong>{{ item.product.name }}</strong>
              <span class="drawer-muted">{{ item.product.sku || 'TL-ESSENTIAL' }}</span>
              <div class="quantity">
                <button class="qty-btn" @click="store.updateQuantity(item.product.id, -1)">-</button>
                <span>{{ item.quantity }}</span>
                <button class="qty-btn" @click="store.updateQuantity(item.product.id, 1)">+</button>
              </div>
            </div>
            <div class="drawer-price">
              <span class="price">{{ store.formatCurrency(item.product.price) }}</span>
              <button class="link" @click="store.removeFromCart(item.product.id)">Remove</button>
            </div>
          </div>
        </div>

        <div class="drawer-summary">
          <div class="drawer-row">
            <span>Subtotal</span>
            <span class="price">{{ store.formatCurrency(store.subtotal) }}</span>
          </div>
          <router-link
            class="btn btn-primary drawer-cta"
            to="/cart"
            @click="store.closeCart"
          >
            Finalizar pedido
          </router-link>
        </div>
      </aside>
    </div>

    <footer class="footer">
      <div>Threadline Atelier 2026</div>
      <div>Slow craft. Modern lines.</div>
    </footer>
  </div>
</template>
