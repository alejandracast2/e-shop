<template>
  <section class="section">
    <div class="container">
      <div class="eyebrow">Carrito</div>
      <h1 class="title">Tus favoritos listos</h1>
      <p class="subtitle">
        Ajusta cantidades o continua al checkout cuando estes listo.
      </p>

      <div v-if="!items.length" class="empty card">
        <p>Tu carrito esta vacio.</p>
        <NuxtLink class="btn btn-primary" to="/">Explorar productos</NuxtLink>
      </div>

      <div v-else class="cart-grid">
        <div class="cart-items">
          <article v-for="item in items" :key="item.variantId" class="cart-row">
            <div class="thumb">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" />
              <div v-else class="thumb-placeholder">{{ initials(item.title) }}</div>
            </div>
            <div class="info">
              <h3>{{ item.title }}</h3>
              <span class="muted">${{ item.price.toFixed(2) }}</span>
            </div>
            <div class="qty">
              <button type="button" @click="updateQuantity(item.variantId, item.quantity - 1)">
                -
              </button>
              <input
                v-model.number="item.quantity"
                type="number"
                min="1"
                @change="updateQuantity(item.variantId, item.quantity)"
              />
              <button type="button" @click="updateQuantity(item.variantId, item.quantity + 1)">
                +
              </button>
            </div>
            <div class="line-total">${{ (item.price * item.quantity).toFixed(2) }}</div>
            <button class="remove" type="button" @click="removeItem(item.variantId)">
              Quitar
            </button>
          </article>
        </div>
        <CartSummary :items="items" :total="total" />
      </div>

      <div v-if="items.length" class="actions">
        <NuxtLink class="btn btn-ghost" to="/">Seguir comprando</NuxtLink>
        <NuxtLink class="btn btn-primary" to="/checkout">Ir a checkout</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { items, total, updateQuantity, removeItem } = useCart();

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
</script>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  margin-top: 32px;
}

.cart-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  gap: 24px;
  margin-top: 32px;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cart-row {
  display: grid;
  grid-template-columns: 70px 1fr auto auto auto;
  gap: 16px;
  align-items: center;
  background: #fff;
  padding: 16px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
}

.thumb {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--surface-strong);
  display: grid;
  place-items: center;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  font-weight: 700;
  color: var(--accent-strong);
}

.info h3 {
  margin: 0 0 6px;
}

.muted {
  color: var(--muted);
  font-size: 14px;
}

.qty {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  background: var(--surface);
  border-radius: 999px;
  padding: 6px 10px;
}

.qty button {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.qty input {
  width: 50px;
  border: none;
  background: transparent;
  text-align: center;
  font-weight: 600;
}

.line-total {
  font-weight: 700;
}

.remove {
  border: none;
  background: transparent;
  color: var(--accent-strong);
  cursor: pointer;
  font-weight: 600;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 900px) {
  .cart-grid {
    grid-template-columns: 1fr;
  }

  .cart-row {
    grid-template-columns: 70px 1fr;
  }
}
</style>
