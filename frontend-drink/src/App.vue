<script setup>
import AgeVerification from './components/AgeVerification.vue'
import CategoryNav from './components/CategoryNav.vue'
import CartDrawer from './components/storefront/CartDrawer.vue'
import StoreToast from './components/storefront/StoreToast.vue'
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

    <CartDrawer />
    <StoreToast />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');


:global(body) {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(143, 34, 48, 0.08), transparent 22%),
    linear-gradient(180deg, #faf7f2, #f4ede3 42%, #fbf9f6);
  color: #12100f;
  font-family: 'Manrope', 'Segoe UI', sans-serif;
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
  color: var(--bone);
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
  color: var(--soft);
  font-weight: 500;
  letter-spacing: .18em
}




.age-card {
  width: min(520px, 100%);
  padding: 34px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(143, 34, 48, 0.16), transparent 28%),
    #faf7f2;
  box-shadow: 0 32px 80px -50px rgba(0, 0, 0, 0.6);
}

.eyebrow {
  margin: 0 0 12px;
  color: #7b1f2c;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.age-card h1 {
  margin: 0;
  color: #12100f;
  font-family: 'Georgia', serif;
  font-size: 48px;
  letter-spacing: -0.06em;
}

.age-card p:last-of-type {
  margin: 18px 0 0;
  color: #453d38;
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
  background: #6b1520;
  color: #faf7f2;
}

.ghost-button {
  border: 1px solid rgba(18, 16, 15, 0.12);
  color: #12100f;
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
