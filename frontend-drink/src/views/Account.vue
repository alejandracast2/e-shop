<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { useStorefrontAuthStore } from '../stores/storefrontAuth'
import { useStorefrontCartStore } from '../stores/storefrontCart'
import { useStorefrontFavoritesStore } from '../stores/storefrontFavorites'
import { useStorefrontUiStore } from '../stores/storefrontUi'

const router = useRouter()
const authStore = useStorefrontAuthStore()
const cartStore = useStorefrontCartStore()
const favoritesStore = useStorefrontFavoritesStore()
const uiStore = useStorefrontUiStore()
const { user, customer, customerProfile, isAuthenticated, loading, error } = storeToRefs(authStore)
const { cartCount } = storeToRefs(cartStore)
const { favoriteCount } = storeToRefs(favoritesStore)

const ready = ref(false)
const editing = ref(false)
const promotionsEnabled = ref(true)
const form = reactive({
  name: '',
  phone: '',
  documentId: '',
  birthDate: '',
})

const profile = computed(() => customerProfile.value || customer.value)
const accountName = computed(() => profile.value?.fullName || user.value?.name || 'Cliente')
const email = computed(() => user.value?.email || profile.value?.email || 'Sin correo registrado')

function formatDate(date) {
  if (!date) return 'Sin registrar'

  const [year, month, day] = String(date).split('-').map(Number)
  if (!year || !month || !day) return date

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function beginEditing() {
  form.name = accountName.value === 'Cliente' ? '' : accountName.value
  form.phone = profile.value?.phone || ''
  form.documentId = profile.value?.documentId || ''
  form.birthDate = profile.value?.birthDate || ''
  authStore.error = ''
  editing.value = true
}

function cancelEditing() {
  authStore.error = ''
  editing.value = false
}

async function saveProfile() {
  const response = await authStore.completeAgeProfile({ ...form })
  if (!response) return

  await authStore.loadCustomerProfile()
  editing.value = false
  uiStore.showToast('Tu perfil fue actualizado.')
}

function showUnavailableSection() {
  uiStore.showToast('Esta sección estará disponible próximamente.')
}

function openFavorites() {
  router.push({ name: 'favorites' })
}

function openCart() {
  uiStore.openCart()
}

async function signOut() {
  await authStore.clearSession()
  uiStore.showToast('Has cerrado sesión.')
  router.push({ name: 'home' })
}

onMounted(async () => {
  await authStore.restoreSession()
  if (!isAuthenticated.value) {
    router.replace({ name: 'home' })
    uiStore.openAccountModal()
    return
  }

  await authStore.loadCustomerProfile()
  ready.value = true
})
</script>

<template>
  <main v-if="ready" class="account-view">
    <div class="account-layout">
      <header class="account-intro">
        <p class="breadcrumb">
          <span>Inicio</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          <span>Mi perfil</span>
        </p>
        <h1 id="profile-title">Mi <em>perfil</em></h1>
        <p>Administra tu información personal y preferencias</p>
      </header>

      <div class="account-body">
        <aside class="account-sidebar" aria-label="Navegación de cuenta">
          <div class="account-user">
            <span class="account-user__avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>
            </span>
            <div>
              <strong>{{ accountName }}</strong>
              <span>{{ email }}</span>
            </div>
          </div>

          <nav class="account-navigation">
            <button class="account-nav-link active" type="button" aria-current="page">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>
              <span>Mi perfil</span>
            </button>
            <button class="account-nav-link" type="button" @click="showUnavailableSection">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></svg>
              <span>Mis pedidos</span>
              <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
            <button class="account-nav-link" type="button" @click="openFavorites">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" /></svg>
              <span>Favoritos</span>
              <span v-if="favoriteCount" class="nav-count">{{ favoriteCount }}</span>
            </button>
            <button class="account-nav-link" type="button" @click="openCart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
              <span>Mi carrito</span>
              <span v-if="cartCount" class="nav-count">{{ cartCount }}</span>
            </button>
            <button class="account-nav-link" type="button" @click="showUnavailableSection">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
              <span>Mis direcciones</span>
              <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
            <button class="account-nav-link" type="button" @click="showUnavailableSection">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></svg>
              <span>Métodos de pago</span>
              <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </nav>

          <div class="account-nav-divider" aria-hidden="true"></div>
          <nav class="account-navigation account-navigation--secondary">
            <button class="account-nav-link" type="button" @click="showUnavailableSection">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V20.3h-3v-.08a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.56-1.04h-.08v-3h.08A1.7 1.7 0 0 0 7 9.92a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.7 4.7v-.08h3v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04h.08v3h-.08A1.7 1.7 0 0 0 19.4 15Z" /></svg>
              <span>Configuración</span>
              <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
            <button class="account-nav-link" type="button" @click="showUnavailableSection">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.82c-.96.87-1.7 1.38-1.7 2.68" /><path d="M12 17h.01" /></svg>
              <span>Ayuda y soporte</span>
              <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </nav>
          <div class="account-nav-divider" aria-hidden="true"></div>
          <button class="sign-out" type="button" @click="signOut">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-7" /></svg>
            <span>Cerrar sesión</span>
          </button>
        </aside>

        <section class="profile-content" aria-labelledby="profile-title">
          <template v-if="!editing">
            <section class="account-card" aria-labelledby="personal-information-title">
              <div class="card-heading">
                <h2 id="personal-information-title">Información personal</h2>
                <button class="outline-edit-button" type="button" @click="beginEditing">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 20 4.2-1 10-10a2.8 2.8 0 0 0-4-4l-10 10L4 20Z" /><path d="m12.5 6.5 4 4" /></svg>Editar
                </button>
              </div>
              <dl class="information-grid">
                <div class="information-item"><dt>Nombre completo</dt><dd>{{ accountName }}</dd></div>
                <div class="information-item"><dt>Fecha de nacimiento</dt><dd>{{ formatDate(profile?.birthDate) }}</dd></div>
                <div class="information-item"><dt>Correo electrónico</dt><dd>{{ email }}</dd></div>
                <div class="information-item"><dt>Documento de identidad</dt><dd>{{ profile?.documentId || 'Sin registrar' }}</dd></div>
                <div class="information-item"><dt>Teléfono</dt><dd>{{ profile?.phone || 'Sin registrar' }}</dd></div>
                <div class="information-item"><dt>Género</dt><dd>No especificado</dd></div>
              </dl>
            </section>

            <section class="account-card preferences-card" aria-labelledby="preferences-title">
              <div class="card-heading">
                <h2 id="preferences-title">Preferencias</h2>
                <button class="outline-edit-button" type="button" @click="beginEditing">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 20 4.2-1 10-10a2.8 2.8 0 0 0-4-4l-10 10L4 20Z" /><path d="m12.5 6.5 4 4" /></svg>Editar
                </button>
              </div>
              <div class="preference-row">
                <div><h3>Recibir promociones y novedades</h3><p>Te mantendremos al tanto de nuestras mejores ofertas.</p></div>
                <button class="preference-switch" :class="{ 'preference-switch--on': promotionsEnabled }" :aria-pressed="promotionsEnabled" type="button" @click="promotionsEnabled = !promotionsEnabled"><span></span><span class="sr-only">Activar promociones y novedades</span></button>
              </div>
            </section>
          </template>

          <form v-else class="account-card edit-profile-form" @submit.prevent="saveProfile">
            <div class="card-heading"><h2>Editar información personal</h2></div>
            <p v-if="error" class="edit-feedback">{{ error }}</p>
            <div class="form-grid">
              <label>Nombre completo<input v-model.trim="form.name" autocomplete="name" required /></label>
              <label>Teléfono<input v-model.trim="form.phone" autocomplete="tel" type="tel" /></label>
              <label>Correo electrónico<input :value="email" type="email" disabled /></label>
              <label>Documento de identidad<input v-model.trim="form.documentId" inputmode="numeric" minlength="5" required /></label>
              <label>Fecha de nacimiento<input v-model="form.birthDate" type="date" required /></label>
            </div>
            <div class="form-actions">
              <button class="cancel-button" type="button" @click="cancelEditing">Cancelar</button>
              <button class="save-profile-button" :disabled="loading" type="submit">{{ loading ? 'Guardando…' : 'Guardar cambios' }}</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.account-view {
  min-height: 720px;
  background: linear-gradient(118deg, rgba(255, 253, 251, .9), rgba(250, 247, 243, .96));
}

.account-layout { width: min(100%, 1480px); margin: 0 auto; padding: 24px 34px 64px; }
.account-intro { margin: 0 0 30px; }
.breadcrumb { display: flex; align-items: center; gap: 7px; margin: 0 0 11px; color: #8b8987; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
.breadcrumb svg { width: 13px; height: 13px; color: #aaa6a2; }
.account-intro h1 { margin: 0; color: #1f1b19; font-family: var(--font-display); font-size: clamp(38px, 3vw, 48px); font-weight: 700; line-height: 1; letter-spacing: -.055em; }
.account-intro h1 em { color: var(--wine); font-weight: 500; }
.account-intro > p:last-child { margin: 8px 0 0; color: #77716d; font-size: 14px; }

.account-body { display: grid; grid-template-columns: 378px minmax(0, 1fr); align-items: start; gap: 32px; }
.account-sidebar, .account-card { border: 1px solid rgba(51, 39, 34, .08); border-radius: 13px; background: rgba(255, 255, 255, .9); box-shadow: 0 3px 10px rgba(39, 27, 21, .055); }
.account-sidebar { padding: 18px 0 14px; overflow: hidden; }
.account-user { display: flex; align-items: center; gap: 16px; padding: 0 18px 14px; }
.account-user__avatar { display: grid; width: 80px; height: 80px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: radial-gradient(circle at 35% 25%, #fff, #f4ebe7); color: #1f1b19; }
.account-user__avatar svg { width: 42px; height: 42px; }
.account-user strong, .account-user span:not(.account-user__avatar) { display: block; }
.account-user strong { max-width: 205px; color: #201b18; font-size: 16px; font-weight: 800; line-height: 1.6; }
.account-user div span { max-width: 210px; overflow: hidden; color: #7b7571; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }

.account-navigation { display: grid; gap: 1px; padding: 0 11px; }
.account-navigation--secondary { padding-top: 1px; }
.account-nav-link, .sign-out { display: grid; grid-template-columns: 23px minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 42px; width: 100%; padding: 8px 10px; border-radius: 9px; color: #292320; font-size: 14px; font-weight: 600; text-align: left; transition: color .16s ease, background .16s ease; }
.account-nav-link > svg:first-child, .sign-out > svg { width: 21px; height: 21px; }
.account-nav-link:hover { background: #fbf5f2; color: var(--text-brand-dark); }
.account-nav-link.active { position: relative; background: linear-gradient(90deg, #fff7f5, #f8f2ef); color: var(--wine); font-weight: 800; }
.account-nav-link.active::before { position: absolute; top: 0; bottom: 0; left: -11px; width: 3px; border-radius: 0 2px 2px 0; background: var(--wine); content: ''; }
.nav-chevron { width: 17px; height: 17px; color: #2c2927; }
.nav-count { display: grid; min-width: 23px; height: 23px; place-items: center; border-radius: 999px; background: var(--wine); color: var(--white); font-size: 11px; font-weight: 800; }
.account-nav-divider { height: 1px; margin: 12px 18px; background: rgba(51, 39, 34, .11); }
.sign-out { grid-template-columns: 23px minmax(0, 1fr); margin: 0 11px; width: calc(100% - 22px); color: var(--wine); font-weight: 700; }
.sign-out:hover { background: #fff5f3; }

.profile-content { min-width: 0; }
.account-card { overflow: hidden; }
.account-card + .account-card { margin-top: 22px; }
.card-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 90px; padding: 20px 27px; border-bottom: 1px solid rgba(51, 39, 34, .11); }
.card-heading h2 { margin: 0; color: #221d1a; font-size: 19px; font-weight: 800; letter-spacing: -.035em; }
.outline-edit-button { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-width: 96px; min-height: 42px; padding: 8px 15px; border: 1px solid var(--wine); border-radius: 10px; color: var(--wine); font-size: 13px; font-weight: 700; transition: background .16s ease, color .16s ease; }
.outline-edit-button:hover { background: var(--wine); color: var(--white); }
.outline-edit-button svg { width: 16px; height: 16px; }

.information-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 42px; margin: 0; padding: 24px 27px 27px; }
.information-item { min-width: 0; padding: 0 0 28px; }
.information-item:nth-last-child(-n + 2) { padding-bottom: 0; }
.information-item dt { color: #89847f; font-size: 13px; font-weight: 600; }
.information-item dd { margin: 5px 0 0; overflow-wrap: anywhere; color: #241f1c; font-size: 14px; font-weight: 600; }
.preferences-card { min-height: 185px; }
.preference-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 21px 27px 25px; }
.preference-row h3 { margin: 0; color: #251f1c; font-size: 14px; font-weight: 800; }
.preference-row p { margin: 3px 0 0; color: #847d78; font-size: 13px; }
.preference-switch { position: relative; width: 45px; height: 27px; flex: 0 0 auto; padding: 3px; border-radius: 999px; background: #cfc9c5; transition: background .18s ease; }
.preference-switch > span:first-child { display: block; width: 21px; height: 21px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .2); transition: transform .18s ease; }
.preference-switch--on { background: var(--wine); }
.preference-switch--on > span:first-child { transform: translateX(18px); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

.edit-profile-form { padding-bottom: 28px; }
.edit-feedback { margin: 20px 27px 0; padding: 10px 12px; border-radius: 8px; background: #fff0f0; color: var(--text-brand-dark); font-size: 13px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; padding: 24px 27px 0; }
.form-grid label { display: grid; gap: 7px; color: #554e49; font-size: 12px; font-weight: 800; }
.form-grid input { min-height: 46px; width: 100%; border: 1px solid #dcd6d2; border-radius: 8px; padding: 10px 12px; background: #fff; font-size: 14px; outline: 0; transition: border-color .16s ease, box-shadow .16s ease; }
.form-grid input:focus { border-color: var(--wine); box-shadow: 0 0 0 3px rgba(179, 38, 30, .13); }
.form-grid input:disabled { cursor: not-allowed; background: #f7f5f3; color: #877f7a; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin: 28px 27px 0; }
.cancel-button, .save-profile-button { min-height: 46px; border-radius: 9px; padding: 0 18px; font-size: 13px; font-weight: 800; }
.cancel-button { border: 1px solid #d6d0cb; color: #544d48; }
.cancel-button:hover { background: #f7f4f1; }
.save-profile-button { min-width: 158px; background: var(--wine); color: var(--white); }
.save-profile-button:hover { background: var(--wine-2); }
.save-profile-button:disabled { cursor: wait; opacity: .65; }

@media (max-width: 980px) {
  .account-body { grid-template-columns: 300px minmax(0, 1fr); gap: 22px; }
  .account-user strong { max-width: 150px; }
  .account-user div span { max-width: 155px; }
}

@media (max-width: 760px) {
  .account-layout { padding: 20px 18px 48px; }
  .account-intro { margin-bottom: 24px; }
  .account-body { grid-template-columns: 1fr; }
  .account-sidebar { padding-top: 16px; }
  .account-navigation { display: flex; overflow-x: auto; padding: 0 12px 8px; scrollbar-width: none; }
  .account-navigation::-webkit-scrollbar { display: none; }
  .account-nav-link { min-width: max-content; }
  .account-nav-link.active::before { top: auto; right: 12px; bottom: -8px; left: 12px; width: auto; height: 3px; }
  .account-nav-divider { margin: 4px 18px 12px; }
  .account-navigation--secondary { margin-top: 0; }
  .sign-out { margin-top: 2px; }
}

@media (max-width: 540px) {
  .account-intro h1 { font-size: 38px; }
  .account-intro > p:last-child { font-size: 13px; }
  .account-user__avatar { width: 66px; height: 66px; }
  .account-user__avatar svg { width: 35px; height: 35px; }
  .card-heading { min-height: 76px; padding: 16px 18px; }
  .card-heading h2 { font-size: 17px; }
  .outline-edit-button { min-width: 82px; min-height: 37px; padding: 6px 11px; font-size: 12px; }
  .information-grid { grid-template-columns: 1fr; gap: 0; padding: 21px 18px; }
  .information-item, .information-item:nth-last-child(-n + 2) { padding-bottom: 20px; }
  .information-item:last-child { padding-bottom: 0; }
  .preference-row { padding: 18px; }
  .preference-row p { max-width: 235px; }
  .form-grid { grid-template-columns: 1fr; padding: 20px 18px 0; }
  .form-actions { flex-direction: column-reverse; margin: 24px 18px 0; }
  .cancel-button, .save-profile-button { width: 100%; }
}
</style>
