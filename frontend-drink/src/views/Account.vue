<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { useStorefrontAuthStore } from '../stores/storefrontAuth'
import { useStorefrontUiStore } from '../stores/storefrontUi'

const router = useRouter()
const authStore = useStorefrontAuthStore()
const uiStore = useStorefrontUiStore()
const { user, customer, isAuthenticated, loading, error } = storeToRefs(authStore)

const ready = ref(false)
const editing = ref(false)
const form = reactive({
  name: '',
  phone: '',
  documentId: '',
  birthDate: '',
})

const accountName = computed(() => user.value?.name || customer.value?.fullName || 'Cliente')
const email = computed(() => user.value?.email || customer.value?.email || 'Sin correo registrado')
const nameParts = computed(() => {
  const parts = accountName.value.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || 'Sin registrar',
    lastName: parts.slice(1).join(' ') || 'Sin registrar',
  }
})
const initials = computed(() =>
  accountName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
)
const verificationText = computed(() =>
  customer.value?.isAgeConfirmed ? 'Cuenta verificada' : 'Perfil pendiente de completar',
)

function formatDate(date) {
  if (!date) return 'Sin registrar'

  const [year, month, day] = String(date).split('-').map(Number)
  if (!year || !month || !day) return date

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function beginEditing() {
  form.name = accountName.value === 'Cliente' ? '' : accountName.value
  form.phone = customer.value?.phone || user.value?.phone || ''
  form.documentId = customer.value?.documentId || ''
  form.birthDate = customer.value?.birthDate || ''
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

  editing.value = false
  uiStore.showToast('Tu perfil fue actualizado.')
}

function showUnavailableSection() {
  uiStore.showToast('Esta sección estará disponible próximamente.')
}

function signOut() {
  authStore.clearSession()
  uiStore.showToast('Has cerrado sesión.')
  router.push({ name: 'home' })
}

onMounted(() => {
  authStore.restoreSession()
  if (!isAuthenticated.value) {
    router.replace({ name: 'home' })
    uiStore.openAccountModal()
    return
  }

  ready.value = true
})
</script>

<template>
  <main v-if="ready" class="account-view">
    <aside class="account-sidebar" aria-label="Navegación de cuenta">
      <div class="welcome">
        <span class="avatar avatar--large" aria-hidden="true">{{ initials || 'C' }}</span>
        <div>
          <strong>¡Hola, {{ nameParts.firstName }}!</strong>
          <span>Bienvenido de nuevo</span>
        </div>
      </div>

      <nav class="account-navigation">
        <button class="account-nav-link active" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>
          Perfil
        </button>
        <button class="account-nav-link" type="button" @click="showUnavailableSection">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
          Direcciones
        </button>
        <button class="account-nav-link" type="button" @click="showUnavailableSection">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 7h14l1 13H4L5 7Z" /><path d="M9 9V5a3 3 0 0 1 6 0v4" /></svg>
          Pedidos
        </button>
        <button class="account-nav-link" type="button" @click="showUnavailableSection">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3 5 6v5c0 4.7 3 8.3 7 10 4-1.7 7-5.3 7-10V6l-7-3Z" /><path d="m9.5 12 1.7 1.7 3.7-3.7" /></svg>
          Autenticación
        </button>
      </nav>

      <button class="sign-out" type="button" @click="signOut">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-7" /></svg>
        Cerrar sesión
      </button>
    </aside>

    <section class="profile-content" aria-labelledby="profile-title">
      <header class="page-title">
        <h1 id="profile-title">Perfil</h1>
        <span aria-hidden="true"></span>
      </header>

      <template v-if="!editing">
        <section class="profile-identity" aria-label="Resumen de perfil">
          <span class="avatar" aria-hidden="true">{{ initials || 'C' }}</span>
          <div class="profile-identity__copy">
            <h2>{{ accountName }}</h2>
            <p>{{ email }}</p>
          </div>
          <span class="verification-pill" :class="{ 'verification-pill--pending': !customer?.isAgeConfirmed }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></svg>
            {{ verificationText }}
          </span>
        </section>

        <section class="personal-information" aria-labelledby="personal-information-title">
          <div class="section-heading">
            <h2 id="personal-information-title">Información personal</h2>
          </div>

          <dl class="information-grid">
            <div class="information-item">
              <span class="information-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></svg></span>
              <div><dt>Nombre</dt><dd>{{ nameParts.firstName }}</dd></div>
            </div>
            <div class="information-item">
              <span class="information-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></svg></span>
              <div><dt>Apellido</dt><dd>{{ nameParts.lastName }}</dd></div>
            </div>
            <div class="information-item">
              <span class="information-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 5h16v14H4z" /><path d="m4 7 8 6 8-6" /></svg></span>
              <div><dt>Correo electrónico</dt><dd>{{ email }}</dd></div>
            </div>
            <div class="information-item">
              <span class="information-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M12 10h5M12 13h5M5.5 16h12" /></svg></span>
              <div><dt>Cédula de ciudadanía</dt><dd>{{ customer?.documentId || 'Sin registrar' }}</dd></div>
            </div>
            <div class="information-item">
              <span class="information-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg></span>
              <div><dt>Fecha de nacimiento</dt><dd>{{ formatDate(customer?.birthDate) }}</dd></div>
            </div>
            <div class="information-item">
              <span class="information-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10" cy="8" r="3" /><path d="M10 21v-7M6.5 17.5h7M16 4v8M13 7h6" /></svg></span>
              <div><dt>Género</dt><dd>No especificado</dd></div>
            </div>
            <div class="information-item">
              <span class="information-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 3h3l2 5-2.5 1.5a15 15 0 0 0 4.9 4.9L16 12l5 2v3c0 1.1-.9 2-2 2C10.2 19 5 13.8 5 5c0-1.1.9-2 2-2Z" /></svg></span>
              <div><dt>Teléfono</dt><dd>{{ customer?.phone || user?.phone || 'Sin registrar' }}</dd></div>
            </div>
          </dl>
        </section>

        <button class="edit-profile-button" type="button" @click="beginEditing">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 20 4.2-1 10-10a2.8 2.8 0 0 0-4-4l-10 10L4 20Z" /><path d="m12.5 6.5 4 4" /></svg>
          Editar perfil
        </button>
      </template>

      <form v-else class="edit-profile-form" @submit.prevent="saveProfile">
        <div class="section-heading"><h2>Editar información personal</h2></div>
        <p v-if="error" class="edit-feedback">{{ error }}</p>
        <div class="form-grid">
          <label>Nombre completo<input v-model.trim="form.name" autocomplete="name" required /></label>
          <label>Teléfono<input v-model.trim="form.phone" autocomplete="tel" type="tel" /></label>
          <label>Correo electrónico<input :value="email" type="email" disabled /></label>
          <label>Cédula de ciudadanía<input v-model.trim="form.documentId" inputmode="numeric" minlength="5" required /></label>
          <label>Fecha de nacimiento<input v-model="form.birthDate" type="date" required /></label>
        </div>
        <div class="form-actions">
          <button class="cancel-button" type="button" @click="cancelEditing">Cancelar</button>
          <button class="edit-profile-button" :disabled="loading" type="submit">{{ loading ? 'Guardando…' : 'Guardar cambios' }}</button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
.account-view {
  display: grid;
  grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);
  min-height: 720px;
  background: #fff;
}

.account-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 54px 28px 38px;
  background: linear-gradient(150deg, #fafafa 0%, #f3f3f3 100%);
  border-right: 1px solid #ececec;
}

.welcome { display: flex; align-items: center; gap: 14px; padding: 0 6px; }
.welcome strong { display: block; font-size: 15px; font-weight: 800; }
.welcome span:not(.avatar) { display: block; margin-top: 4px; color: var(--text-secondary); font-size: 12px; }

.avatar {
  display: grid;
  width: 78px;
  height: 78px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 25%, #fff8f6, #f3e6e8);
  color: var(--text-brand);
  font-size: 24px;
  font-weight: 800;
}

.avatar--large { width: 70px; height: 70px; font-size: 21px; }
.account-navigation { display: grid; gap: 6px; margin-top: 42px; }

.account-nav-link,
.sign-out {
  display: flex;
  align-items: center;
  gap: 19px;
  width: 100%;
  min-height: 55px;
  padding: 14px 18px;
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  transition: background .18s ease, color .18s ease;
}

.account-nav-link svg,
.sign-out svg { width: 22px; height: 22px; flex: 0 0 auto; }
.account-nav-link:hover { background: #eee; }
.account-nav-link.active { background: linear-gradient(100deg, var(--wine), var(--wine-2)); color: var(--text-on-dark); font-weight: 800; }

.sign-out {
  margin-top: auto;
  padding-top: 28px;
  border-top: 1px solid #e5e5e5;
  border-radius: 0;
}

.sign-out:hover { color: var(--text-brand-dark); }

.profile-content { width: min(100%, 1160px); padding: 48px 42px 60px; }
.page-title { display: grid; gap: 12px; margin-bottom: 38px; }
.page-title h1 { margin: 0; font-size: clamp(30px, 3vw, 38px); line-height: 1; letter-spacing: -.05em; }
.page-title span { width: 40px; height: 3px; border-radius: 999px; background: var(--wine); }

.profile-identity,
.information-grid,
.edit-profile-form {
  border: 1px solid #ededed;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(18, 16, 15, .035);
}

.profile-identity { display: flex; align-items: center; gap: 22px; padding: 25px 28px; }
.profile-identity__copy h2 { margin: 0; font-size: 18px; letter-spacing: -.03em; }
.profile-identity__copy p { margin: 4px 0 0; font-size: 14px; }

.verification-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
  padding: 8px 15px;
  border: 1px solid rgba(179, 38, 30, .3);
  border-radius: 999px;
  background: var(--wine-wash);
  color: var(--text-brand-dark);
  font-size: 12px;
  white-space: nowrap;
}

.verification-pill svg { width: 16px; height: 16px; color: var(--text-accent); }
.verification-pill--pending { border-color: rgba(127, 29, 29, .35); background: #f8e9eb; color: var(--text-brand-dark); }
.verification-pill--pending svg { color: var(--wine); }

.personal-information { margin-top: 34px; }
.section-heading { padding: 0 12px 12px; border-bottom: 1px solid #e7e7e7; }
.section-heading h2 { margin: 0; font-size: 18px; letter-spacing: -.03em; }

.information-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 20px; overflow: hidden; }
.information-item { display: flex; align-items: center; gap: 20px; min-height: 105px; padding: 18px 28px; border-bottom: 1px solid #ebebeb; }
.information-item:nth-child(odd) { border-right: 1px solid #ebebeb; }
.information-item:nth-last-child(-n + 2) { border-bottom: 0; }
.information-item:last-child:nth-child(odd) { border-bottom: 0; }

.information-icon { display: grid; width: 60px; height: 60px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: #f3e6e8; color: var(--text-brand); }
.information-icon svg { width: 30px; height: 30px; }
.information-item dt { color: var(--text-primary); font-size: 12px; font-weight: 800; }
.information-item dd { margin: 4px 0 0; font-size: 14px; overflow-wrap: anywhere; }

.edit-profile-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 11px;
  width: 100%;
  min-height: 50px;
  margin-top: 32px;
  border-radius: 10px;
  background: linear-gradient(100deg, var(--wine), var(--wine-2));
  color: var(--text-on-dark);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .02em;
  text-transform: uppercase;
  transition: filter .18s ease, transform .18s ease;
}

.edit-profile-button:hover { filter: brightness(.97); transform: translateY(-1px); }
.edit-profile-button svg { width: 18px; height: 18px; }
.edit-profile-button:disabled { cursor: wait; opacity: .65; transform: none; }

.edit-profile-form { margin-top: 4px; padding: 26px 28px 30px; }
.edit-feedback { margin: 18px 0 0; padding: 10px 12px; border-radius: 8px; background: #fff0f0; color: var(--text-brand-dark); font-size: 13px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 24px; }
.form-grid label { display: grid; gap: 7px; color: var(--text-primary); font-size: 12px; font-weight: 800; }
.form-grid input { width: 100%; min-height: 47px; border: 1px solid #dcdcdc; border-radius: 8px; padding: 10px 12px; background: #fff; font-size: 14px; outline: none; }
.form-grid input:focus { border-color: var(--wine); box-shadow: 0 0 0 3px rgba(179, 38, 30, .18); }
.form-grid input:disabled { cursor: not-allowed; background: #f5f5f5; color: var(--text-secondary); }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 28px; }
.form-actions .edit-profile-button { width: auto; min-width: 190px; margin: 0; padding: 0 22px; }
.cancel-button { min-width: 120px; min-height: 50px; border: 1px solid #dadada; border-radius: 10px; font-size: 13px; font-weight: 800; text-transform: uppercase; }
.cancel-button:hover { background: #f5f5f5; }

@media (max-width: 900px) {
  .account-view { grid-template-columns: 1fr; }
  .account-sidebar { min-height: auto; padding: 28px 24px 0; border-right: 0; border-bottom: 1px solid #ececec; }
  .account-navigation { display: flex; margin: 26px -24px 0; overflow-x: auto; border-top: 1px solid #e5e5e5; }
  .account-nav-link { width: auto; min-width: max-content; border-radius: 0; }
  .sign-out { position: absolute; top: 28px; right: 24px; width: auto; min-height: auto; margin: 0; padding: 10px; border: 0; font-size: 0; }
  .profile-content { padding: 38px 24px 48px; }
}

@media (max-width: 620px) {
  .profile-content { padding: 32px 16px 42px; }
  .page-title { margin-bottom: 28px; }
  .profile-identity { align-items: flex-start; flex-wrap: wrap; padding: 20px; gap: 14px; }
  .profile-identity .avatar { width: 58px; height: 58px; font-size: 18px; }
  .verification-pill { width: 100%; margin-left: 0; justify-content: center; }
  .information-grid, .form-grid { grid-template-columns: 1fr; }
  .information-item, .information-item:nth-child(odd) { min-height: 88px; padding: 16px 20px; border-right: 0; border-bottom: 1px solid #ebebeb; }
  .information-item:nth-last-child(-n + 2) { border-bottom: 1px solid #ebebeb; }
  .information-item:last-child { border-bottom: 0; }
  .information-icon { width: 52px; height: 52px; }
  .form-actions { flex-direction: column-reverse; }
  .form-actions .edit-profile-button, .cancel-button { width: 100%; }
}
</style>
