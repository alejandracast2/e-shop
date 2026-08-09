<script setup>
import AgeVerification from './components/AgeVerification.vue'
import CategoryNav from './components/CategoryNav.vue'
import CartDrawer from './components/storefront/CartDrawer.vue'
import StoreToast from './components/storefront/StoreToast.vue'
import StoreFooter from './components/storefront/StoreFooter.vue'
import CustomerAuthModal from './components/CustomerAuthModal.vue'
import CheckoutModal from './components/storefront/CheckoutModal.vue'
</script>

<template>
  <div class="page-shell">
    <AgeVerification />

    <!-- Announce -->
    <div class="announce">
      <span>Envíos gratis desde <strong>$180.000</strong></span>
    </div>

    <CategoryNav />
    <RouterView />
    <StoreFooter />

    <CartDrawer />
    <CustomerAuthModal />
    <CheckoutModal />
    <StoreToast />
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(179, 38, 30, 0.08), transparent 22%),
    linear-gradient(180deg, #faf7f2, #f4ede3 42%, #fbf9f6);
  color: var(--text-primary);
  font-family: var(--font-sans);
}

:global(*) {
  box-sizing: border-box;
}

.page-shell {
  min-height: 100vh;
}

/* ---------- Announcement bar ---------- */
.announce {
  background: var(--ink);
  color: var(--text-on-dark);
  font-size: 12px;
  letter-spacing: .14em;
  text-transform: uppercase;
  padding: 9px 0;
  text-align: center;
}

.announce span {
  opacity: .7;
  margin: 0 18px
}

.announce strong {
  color: var(--text-accent);
  font-weight: 500;
  letter-spacing: .18em
}




.age-card {
  width: min(520px, 100%);
  padding: 34px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(179, 38, 30, 0.16), transparent 28%),
    #faf7f2;
  box-shadow: 0 32px 80px -50px rgba(0, 0, 0, 0.6);
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--text-brand);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.age-card h1 {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 48px;
  letter-spacing: -0.06em;
}

.age-card p:last-of-type {
  margin: 18px 0 0;
  color: var(--text-secondary);
  line-height: 1.75;
}

.age-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.primary-button,
.ghost-button {
  padding: 14px 20px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  text-decoration: none;
}

.primary-button {
  border: 0;
  background: var(--wine);
  color: var(--text-on-dark);
}

.ghost-button {
  border: 1px solid rgba(18, 16, 15, 0.12);
  color: var(--text-primary);
}

@media (max-width: 720px) {


  .age-card {
    padding: 28px 22px;
  }

  .age-card h1 {
    font-size: 40px;
  }
}
</style>
