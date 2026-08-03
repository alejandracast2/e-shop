<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useStorefrontAuthStore } from '../stores/storefrontAuth'
import { useStorefrontUiStore } from '../stores/storefrontUi'

const authStore = useStorefrontAuthStore()
const uiStore = useStorefrontUiStore()
const { accountModalOpen, accountModalMode } = storeToRefs(uiStore)
const { loading, error, message, requiresAgeConfirmation, isAuthenticated, user, customer } = storeToRefs(authStore)

const mode = ref('login')
const email = ref('')
const password = ref('')
const code = ref('')
const name = ref('')
const phone = ref('')
const documentId = ref('')
const birthDate = ref('')
const confirmsAdultAge = ref(false)
const googleButton = ref(null)
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const canUseGoogle = computed(() => Boolean(googleClientId))

const titles = {
  login: 'Iniciar sesión',
  register: 'Crear cuenta',
  code: 'Código de acceso',
  reset: 'Nueva contraseña',
  profile: 'Confirma tu edad',
  account: 'Mi cuenta',
}

const activeTitle = computed(() => titles[mode.value] || titles.login)
const accountName = computed(() => user.value?.name || customer.value?.name || 'Cliente')
const accountEmail = computed(() => user.value?.email || customer.value?.email || '')
const accountPhone = computed(() => customer.value?.phone || user.value?.phone || '')
const accountDocument = computed(() => {
  const documentId = customer.value?.documentId
  if (!documentId) return ''
  return `•••• ${documentId.slice(-4)}`
})

onMounted(() => {
  authStore.restoreSession()
})

watch(
  [accountModalOpen, accountModalMode, mode, isAuthenticated, requiresAgeConfirmation],
  async ([isOpen, requestedMode, activeMode, authenticated, needsAgeConfirmation]) => {
    if (isOpen && requestedMode === 'account' && authenticated) {
      mode.value = 'account'
      return
    }
    if (isOpen && needsAgeConfirmation) {
      mode.value = 'profile'
      return
    }
    if (isOpen && authenticated) {
      mode.value = 'account'
      return
    }
    if (!isOpen || activeMode !== 'login') return
    await nextTick()
    void renderGoogleButton()
  },
)

function close() {
  uiStore.closeAccountModal()
  authStore.error = ''
  authStore.message = ''
  if (requiresAgeConfirmation.value) {
    mode.value = 'profile'
  } else {
    mode.value = 'login'
  }
}

function setMode(nextMode) {
  mode.value = nextMode
  authStore.error = ''
  authStore.message = ''
}

async function submitLogin() {
  const response = await authStore.login(email.value, password.value)
  completeAuthentication(response)
}

async function submitRegistration() {
  const response = await authStore.register({
    name: name.value,
    email: email.value,
    password: password.value,
    phone: phone.value || undefined,
    birthDate: birthDate.value,
    confirmsAdultAge: confirmsAdultAge.value,
  })
  completeAuthentication(response)
}

async function requestCode(purpose) {
  const sent = await authStore.requestEmailCode(email.value, purpose)
  if (sent) {
    code.value = ''
    mode.value = purpose === 'login' ? 'code' : 'reset'
    authStore.error = ''
  }
}

async function submitCode() {
  const response = await authStore.verifyEmailCode(email.value, code.value)
  completeAuthentication(response)
}

async function submitPasswordReset() {
  const updated = await authStore.resetPassword(email.value, code.value, password.value)
  if (updated) {
    code.value = ''
    password.value = ''
    setMode('login')
  }
}

async function submitProfile() {
  if (!confirmsAdultAge.value) {
    authStore.error = 'Debes confirmar que eres mayor de edad.'
    return
  }

  const response = await authStore.completeAgeProfile({
    birthDate: birthDate.value,
    documentId: documentId.value,
    name: name.value || undefined,
    phone: phone.value || undefined,
  })
  completeAuthentication(response)
}

function completeAuthentication(response) {
  if (!response) return
  if (response.requiresAgeConfirmation) {
    name.value = response.user?.name || name.value
    setMode('profile')
    return
  }
  uiStore.closeAccountModal()
  setMode('login')
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-identity]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google), { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('No fue posible cargar Google Sign-In.'))
    document.head.appendChild(script)
  })
}

async function renderGoogleButton() {
  if (!canUseGoogle.value || !googleButton.value) return

  try {
    const google = await loadGoogleIdentityScript()
    if (!google?.accounts?.id || !googleButton.value) return

    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async ({ credential }) => {
        const response = await authStore.loginWithGoogle(credential)
        completeAuthentication(response)
      },
    })
    googleButton.value.replaceChildren()
    google.accounts.id.renderButton(googleButton.value, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 360,
      locale: 'es',
    })
  } catch (requestError) {
    authStore.error = requestError instanceof Error ? requestError.message : 'Google no está disponible.'
  }
}
</script>

<template>
  <div
    v-if="accountModalOpen"
    class="auth-layer"
    role="presentation"
    @click.self="close"
  >
    <section class="auth-modal" role="dialog" aria-modal="true" :aria-label="activeTitle">
      <button class="auth-close" type="button" aria-label="Cerrar" @click="close">×</button>

      <header class="auth-heading">
        <p class="auth-kicker">La Cantina</p>
        <h2>{{ activeTitle }}</h2>
        <p v-if="mode === 'profile'" class="auth-description">
          Necesitamos confirmar tu fecha de nacimiento antes de permitir compras de licor.
        </p>
      </header>

      <p v-if="error" class="auth-feedback auth-feedback--error">{{ error }}</p>
      <p v-if="message" class="auth-feedback auth-feedback--success">{{ message }}</p>

      <section v-if="mode === 'account'" class="account-summary">
        <div class="account-summary__identity">
          <span class="account-summary__avatar" aria-hidden="true">{{ accountName.charAt(0).toUpperCase() }}</span>
          <div>
            <h3>{{ accountName }}</h3>
            <p v-if="accountEmail">{{ accountEmail }}</p>
          </div>
        </div>

        <dl class="account-summary__details">
          <div v-if="accountPhone">
            <dt>Teléfono</dt>
            <dd>{{ accountPhone }}</dd>
          </div>
          <div v-if="accountDocument">
            <dt>Documento</dt>
            <dd>{{ accountDocument }}</dd>
          </div>
          <div v-if="customer?.birthDate">
            <dt>Fecha de nacimiento</dt>
            <dd>{{ customer.birthDate }}</dd>
          </div>
        </dl>
      </section>

      <form v-else-if="mode === 'login'" class="auth-form" @submit.prevent="submitLogin">
        <label>
          Correo electrónico
          <input v-model.trim="email" autocomplete="email" type="email" required placeholder="Escribe tu correo electrónico" />
        </label>
        <label>
          Contraseña
          <input v-model="password" autocomplete="current-password" type="password" minlength="8" required placeholder="Escribe tu contraseña" />
        </label>
        <button class="text-action text-action--right" type="button" @click="setMode('reset')">
          Olvidé mi contraseña
        </button>
        <button class="auth-submit" :disabled="loading" type="submit">
          {{ loading ? 'Ingresando…' : 'Entrar' }}
        </button>
        <p class="auth-switch">¿No tiene una cuenta? <button type="button" @click="setMode('register')">Regístrese</button></p>
      </form>

      <form v-else-if="mode === 'register'" class="auth-form" @submit.prevent="submitRegistration">
        <label>
          Nombre completo
          <input v-model.trim="name" autocomplete="name" required placeholder="Cómo quieres que te llamemos" />
        </label>
        <label>
          Correo electrónico
          <input v-model.trim="email" autocomplete="email" type="email" required placeholder="correo@ejemplo.com" />
        </label>
        <label>
          Contraseña
          <input v-model="password" autocomplete="new-password" type="password" minlength="8" required placeholder="Mínimo 8 caracteres" />
        </label>
        <label>
          Fecha de nacimiento
          <input v-model="birthDate" type="date" required />
        </label>
        <label>
          Teléfono <span>(opcional)</span>
          <input v-model.trim="phone" autocomplete="tel" type="tel" placeholder="Tu número de contacto" />
        </label>
        <label class="checkbox-label">
          <input v-model="confirmsAdultAge" type="checkbox" required />
          Confirmo que soy mayor de edad.
        </label>
        <button class="auth-submit" :disabled="loading" type="submit">
          {{ loading ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>
        <p class="auth-switch">¿Ya tiene cuenta? <button type="button" @click="setMode('login')">Inicie sesión</button></p>
      </form>

      <form v-else-if="mode === 'code'" class="auth-form" @submit.prevent="submitCode">
        <label>
          Correo electrónico
          <input v-model.trim="email" autocomplete="email" type="email" required />
        </label>
        <label>
          Código de 6 dígitos
          <input v-model.trim="code" autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required placeholder="000000" />
        </label>
        <button class="auth-submit" :disabled="loading" type="submit">{{ loading ? 'Verificando…' : 'Entrar con código' }}</button>
        <button class="text-action" :disabled="loading" type="button" @click="requestCode('login')">Reenviar código</button>
        <button class="text-action" type="button" @click="setMode('login')">Volver al inicio de sesión</button>
      </form>

      <form v-else-if="mode === 'reset'" class="auth-form" @submit.prevent="submitPasswordReset">
        <label>
          Correo electrónico
          <input v-model.trim="email" autocomplete="email" type="email" required placeholder="correo@ejemplo.com" />
        </label>
        <label>
          Código de 6 dígitos
          <input v-model.trim="code" autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required placeholder="000000" />
        </label>
        <label>
          Nueva contraseña
          <input v-model="password" autocomplete="new-password" type="password" minlength="8" required placeholder="Mínimo 8 caracteres" />
        </label>
        <button class="auth-submit" :disabled="loading" type="submit">{{ loading ? 'Actualizando…' : 'Cambiar contraseña' }}</button>
        <button class="text-action" :disabled="loading" type="button" @click="requestCode('password_reset')">Enviar o reenviar código</button>
        <button class="text-action" type="button" @click="setMode('login')">Volver al inicio de sesión</button>
      </form>

      <form v-else class="auth-form" @submit.prevent="submitProfile">
        <label>
          Fecha de nacimiento
          <input v-model="birthDate" type="date" required />
        </label>
        <label>
          Cédula de ciudadanía
          <input v-model.trim="documentId" inputmode="numeric" required placeholder="Número de documento" />
        </label>
        <label>
          Nombre completo <span>(opcional)</span>
          <input v-model.trim="name" autocomplete="name" placeholder="Cómo quieres que te llamemos" />
        </label>
        <label>
          Teléfono <span>(opcional)</span>
          <input v-model.trim="phone" autocomplete="tel" type="tel" placeholder="Tu número de contacto" />
        </label>
        <label class="checkbox-label">
          <input v-model="confirmsAdultAge" type="checkbox" required />
          Confirmo que soy mayor de edad.
        </label>
        <button class="auth-submit" :disabled="loading" type="submit">{{ loading ? 'Guardando…' : 'Confirmar y continuar' }}</button>
      </form>

      <footer v-if="mode === 'login' || mode === 'register'" class="auth-options">
        <p>Selecciona una opción para ingresar</p>
        <button class="secondary-option" :disabled="loading" type="button" @click="requestCode('login')">
          Recibir código de acceso por e-mail
        </button>
        <div v-if="canUseGoogle" ref="googleButton" class="google-button" aria-label="Entrar con Google" />
      </footer>
    </section>
  </div>
</template>

<style scoped>
.auth-layer {
  position: fixed;
  inset: 0;
  z-index: 160;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(18, 16, 15, .62);
}

.auth-modal {
  position: relative;
  width: min(520px, 100%);
  max-height: min(92dvh, 760px);
  overflow: auto;
  border-radius: 18px;
  background: #fff;
  color: #12100f;
  box-shadow: 0 28px 70px rgba(0, 0, 0, .28);
}

.auth-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: #878787;
  color: #fff;
  font-size: 34px;
  font-weight: 300;
  line-height: 1;
}

.auth-heading {
  padding: 52px 46px 10px;
  text-align: center;
}

.auth-kicker {
  margin: 0 0 4px;
  color: var(--wine);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .2em;
  text-transform: uppercase;
}

.auth-heading h2 {
  margin: 0;
  font-size: 24px;
  letter-spacing: -.03em;
}

.auth-description {
  margin: 10px 0 0;
  color: #625d59;
  font-size: 13px;
  line-height: 1.5;
}

.account-summary {
  padding: 24px 46px 38px;
}

.account-summary__identity {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 22px;
  border-bottom: 1px solid #ece8e5;
}

.account-summary__avatar {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: 50%;
  background: var(--wine);
  color: var(--bone);
  font-size: 20px;
  font-weight: 800;
}

.account-summary h3,
.account-summary p {
  margin: 0;
}

.account-summary h3 {
  font-size: 17px;
}

.account-summary p {
  margin-top: 3px;
  color: #625d59;
  font-size: 13px;
}

.account-summary__details {
  display: grid;
  gap: 16px;
  margin: 22px 0 0;
}

.account-summary__details div {
  display: grid;
  gap: 3px;
}

.account-summary__details dt {
  color: #827c76;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.account-summary__details dd {
  margin: 0;
  color: #12100f;
  font-size: 14px;
  font-weight: 700;
}

.auth-form {
  display: grid;
  gap: 14px;
  padding: 22px 46px 28px;
}

.auth-form label {
  display: grid;
  gap: 7px;
  color: #2b2927;
  font-size: 12px;
  font-weight: 700;
}

.auth-form label span {
  color: #827c76;
  font-weight: 500;
}

.auth-form input:not([type='checkbox']) {
  width: 100%;
  min-height: 50px;
  border: 1px solid #1f1d1b;
  border-radius: 999px;
  padding: 12px 18px;
  outline: none;
  color: #12100f;
  font: inherit;
  font-size: 15px;
}

.auth-form input:focus {
  border-color: var(--wine);
  box-shadow: 0 0 0 3px rgba(143, 34, 48, .12);
}

.checkbox-label {
  grid-template-columns: auto 1fr;
  align-items: start;
  line-height: 1.4;
}

.checkbox-label input {
  margin: 2px 0 0;
}

.auth-submit {
  min-height: 51px;
  border: 0;
  border-radius: 999px;
  background: #bef747;
  color: #12100f;
  font-size: 15px;
  font-weight: 800;
}

.auth-submit:disabled,
.secondary-option:disabled,
.text-action:disabled {
  cursor: not-allowed;
  opacity: .6;
}

.text-action,
.auth-switch button {
  border: 0;
  background: transparent;
  color: #12100f;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  text-decoration: underline;
}

.text-action--right {
  justify-self: end;
}

.auth-switch {
  margin: 4px 0 0;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
}

.auth-feedback {
  margin: 8px 46px 0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.4;
}

.auth-feedback--error {
  background: #fff0f0;
  color: #9c2424;
}

.auth-feedback--success {
  background: #effae1;
  color: #345e10;
}

.auth-options {
  display: grid;
  gap: 12px;
  padding: 18px 46px 28px;
  border-top: 1px solid #ece8e5;
  background: #f7f7f7;
  text-align: center;
}

.auth-options p {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
}

.secondary-option,
.google-button {
  display: grid;
  min-height: 50px;
  place-items: center;
  width: 100%;
  border: 1px solid #e7e2de;
  border-radius: 999px;
  background: #fff;
  color: #12100f;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
}

.google-button {
  overflow: hidden;
}

@media (max-width: 560px) {
  .auth-layer {
    padding: 0;
  }

  .auth-modal {
    width: 100%;
    max-height: 100dvh;
    min-height: 100dvh;
    border-radius: 0;
  }

  .auth-heading,
  .auth-form,
  .auth-options,
  .account-summary {
    padding-left: 26px;
    padding-right: 26px;
  }

  .auth-feedback {
    margin-left: 26px;
    margin-right: 26px;
  }
}
</style>
