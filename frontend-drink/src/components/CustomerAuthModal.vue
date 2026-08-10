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
const passwordVisible = ref(false)
const phoneCountryCode = ref('+57')
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
    if (!isOpen || !['login', 'register'].includes(activeMode)) return
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

function showGoogleSetupMessage() {
  authStore.error = 'El inicio de sesión con Google no está configurado todavía.'
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
    phone: phone.value ? `${phoneCountryCode.value} ${phone.value}` : undefined,
    birthDate: birthDate.value,
    confirmsAdultAge: true,
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
      shape: 'rectangular',
      width: 340,
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

      <div class="auth-modal__scroll">

      <header class="auth-heading" :class="{ 'auth-heading--login': mode === 'login', 'auth-heading--register': mode === 'register' }">
        <template v-if="mode === 'login'">
          <h2>Iniciar <em>sesión</em></h2>
          <p>Bienvenido de nuevo a <strong>La Cantina</strong></p>
        </template>
        <template v-else-if="mode === 'register'">
          <h2>Crear <em>cuenta</em></h2>
          <p>Únete a <strong>La Cantina</strong> y disfruta de beneficios exclusivos</p>
        </template>
        <template v-else>
          <p class="auth-kicker">La Cantina</p>
          <h2>{{ activeTitle }}</h2>
        </template>
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

      <form v-else-if="mode === 'login'" class="auth-form auth-form--login" @submit.prevent="submitLogin">
        <label>
          Correo electrónico
          <span class="auth-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <input v-model.trim="email" autocomplete="email" type="email" required placeholder="Ingresa tu correo electrónico" />
          </span>
        </label>
        <label>
          Contraseña
          <span class="auth-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <input v-model="password" autocomplete="current-password" :type="passwordVisible ? 'text' : 'password'" minlength="8" required placeholder="Ingresa tu contraseña" />
            <button class="auth-password-toggle" type="button" :aria-label="passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="passwordVisible = !passwordVisible">
              <svg v-if="passwordVisible" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M3 3l18 18" />
                <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.1A10.7 10.7 0 0 1 12 4.9c5.2 0 8.7 5.1 8.7 7.1a8.8 8.8 0 0 1-2.1 3.5M6.2 6.2C3.7 8 3.3 10.8 3.3 12c0 2 3.5 7.1 8.7 7.1 1 0 2-.2 2.9-.6" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M3.3 12S6.8 4.9 12 4.9s8.7 7.1 8.7 7.1-3.5 7.1-8.7 7.1S3.3 12 3.3 12Z" />
                <circle cx="12" cy="12" r="2.8" />
              </svg>
            </button>
          </span>
        </label>
        <button class="text-action text-action--right" type="button" @click="setMode('reset')">
          ¿Olvidaste tu contraseña?
        </button>
        <button class="auth-submit" :disabled="loading" type="submit">
          {{ loading ? 'Iniciando sesión…' : 'Iniciar sesión' }}
        </button>
        <div class="auth-divider"><span>o continuar con</span></div>
        <div v-if="canUseGoogle" ref="googleButton" class="google-button" aria-label="Continuar con Google" />
        <button v-else class="google-button" type="button" @click="showGoogleSetupMessage">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.35 12.23c0-.7-.06-1.38-.18-2.03H12v3.84h5.24a4.49 4.49 0 0 1-1.94 2.95v2.49h3.14c1.84-1.69 2.91-4.18 2.91-7.25Z" />
            <path fill="#34A853" d="M12 21.74c2.63 0 4.83-.87 6.44-2.36l-3.14-2.49c-.87.58-1.99.93-3.3.93-2.54 0-4.7-1.72-5.47-4.03H3.29v2.57a9.73 9.73 0 0 0 8.71 5.38Z" />
            <path fill="#FBBC05" d="M6.53 13.79a5.9 5.9 0 0 1 0-3.58V7.64H3.29a9.74 9.74 0 0 0 0 8.72l3.24-2.57Z" />
            <path fill="#EA4335" d="M12 6.18c1.43 0 2.72.49 3.73 1.46l2.79-2.79C16.83 3.27 14.63 2.26 12 2.26a9.73 9.73 0 0 0-8.71 5.38l3.24 2.57C7.3 7.9 9.46 6.18 12 6.18Z" />
          </svg>
          <span>Continuar con Google</span>
        </button>
        <p class="auth-switch">¿No tienes una cuenta? <button type="button" @click="setMode('register')">Crear cuenta</button></p>
      </form>

      <form v-else-if="mode === 'register'" class="auth-form auth-form--register" @submit.prevent="submitRegistration">
        <label>
          Nombre completo
          <span class="auth-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
            </svg>
            <input v-model.trim="name" autocomplete="name" required placeholder="Ingresa tu nombre completo" />
          </span>
        </label>
        <label>
          Correo electrónico
          <span class="auth-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <input v-model.trim="email" autocomplete="email" type="email" required placeholder="Ingresa tu correo electrónico" />
          </span>
        </label>
        <label>
          Contraseña
          <span class="auth-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <input v-model="password" autocomplete="new-password" :type="passwordVisible ? 'text' : 'password'" minlength="8" required placeholder="Crea una contraseña" />
            <button class="auth-password-toggle" type="button" :aria-label="passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="passwordVisible = !passwordVisible">
              <svg v-if="passwordVisible" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M3 3l18 18" />
                <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.1A10.7 10.7 0 0 1 12 4.9c5.2 0 8.7 5.1 8.7 7.1a8.8 8.8 0 0 1-2.1 3.5M6.2 6.2C3.7 8 3.3 10.8 3.3 12c0 2 3.5 7.1 8.7 7.1 1 0 2-.2 2.9-.6" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M3.3 12S6.8 4.9 12 4.9s8.7 7.1 8.7 7.1-3.5 7.1-8.7 7.1S3.3 12 3.3 12Z" />
                <circle cx="12" cy="12" r="2.8" />
              </svg>
            </button>
          </span>
          <small class="auth-field-hint">Mínimo 8 caracteres, incluye números y letras.</small>
        </label>
        <label>
          Fecha de nacimiento
          <span class="auth-input auth-date-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M7 3v4M17 3v4M3 10h18" />
            </svg>
            <input v-model="birthDate" type="date" required aria-label="Fecha de nacimiento" />
            <span v-if="!birthDate" class="auth-date-placeholder">Selecciona tu fecha de nacimiento</span>
          </span>
        </label>
        <label>
          Teléfono <span>(opcional)</span>
          <span class="auth-input auth-phone-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M5.4 3.7 8.1 3c.5-.1 1 .1 1.2.6l1.3 3.1c.2.5.1 1-.3 1.3L8.7 9.4a15.2 15.2 0 0 0 5.9 5.9l1.4-1.6c.3-.4.8-.5 1.3-.3l3.1 1.3c.5.2.7.7.6 1.2l-.7 2.7c-.1.5-.6.9-1.1.9C10.4 19.5 4.5 13.6 4.5 4.8c0-.5.4-1 .9-1.1Z" />
            </svg>
            <select v-model="phoneCountryCode" aria-label="Indicativo telefónico">
              <option value="+57">+57</option>
            </select>
            <input v-model.trim="phone" autocomplete="tel" type="tel" placeholder="Ingresa tu número de teléfono" />
          </span>
        </label>
        <aside class="auth-data-note" aria-label="Protección de datos">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
          </svg>
          <div>
            <strong>Tus datos están protegidos</strong>
            <p>Usamos tu información únicamente para mejorar tu experiencia y ofrecerte los mejores productos.</p>
          </div>
        </aside>
        <button class="auth-submit" :disabled="loading" type="submit">
          {{ loading ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>
        <div class="auth-divider"><span>o continuar con</span></div>
        <div v-if="canUseGoogle" ref="googleButton" class="google-button" aria-label="Continuar con Google" />
        <button v-else class="google-button" type="button" @click="showGoogleSetupMessage">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.35 12.23c0-.7-.06-1.38-.18-2.03H12v3.84h5.24a4.49 4.49 0 0 1-1.94 2.95v2.49h3.14c1.84-1.69 2.91-4.18 2.91-7.25Z" />
            <path fill="#34A853" d="M12 21.74c2.63 0 4.83-.87 6.44-2.36l-3.14-2.49c-.87.58-1.99.93-3.3.93-2.54 0-4.7-1.72-5.47-4.03H3.29v2.57a9.73 9.73 0 0 0 8.71 5.38Z" />
            <path fill="#FBBC05" d="M6.53 13.79a5.9 5.9 0 0 1 0-3.58V7.64H3.29a9.74 9.74 0 0 0 0 8.72l3.24-2.57Z" />
            <path fill="#EA4335" d="M12 6.18c1.43 0 2.72.49 3.73 1.46l2.79-2.79C16.83 3.27 14.63 2.26 12 2.26a9.73 9.73 0 0 0-8.71 5.38l3.24 2.57C7.3 7.9 9.46 6.18 12 6.18Z" />
          </svg>
          <span>Continuar con Google</span>
        </button>
        <p class="auth-switch">¿Ya tienes una cuenta? <button type="button" @click="setMode('login')">Iniciar sesión</button></p>
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

      </div>
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
  background: rgba(18, 16, 15, .58);
}

.auth-modal {
  position: relative;
  width: min(400px, 100%);
  max-height: min(92dvh, 720px);
  overflow: hidden;
  border: 1px solid rgba(36, 31, 26, .08);
  border-radius: 14px;
  background: #fff;
  color: var(--text-primary);
  box-shadow: 0 24px 54px rgba(0, 0, 0, .25);
}

.auth-modal__scroll {
  max-height: min(92dvh, 720px);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: rgba(113, 105, 100, .55) transparent;
  scrollbar-width: thin;
}

.auth-modal__scroll::-webkit-scrollbar {
  width: 6px;
}

.auth-modal__scroll::-webkit-scrollbar-track {
  background: transparent;
}

.auth-modal__scroll::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: rgba(113, 105, 100, .52);
  background-clip: padding-box;
}

.auth-modal__scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(113, 105, 100, .74);
  background-clip: padding-box;
}

.auth-close {
  position: absolute;
  z-index: 1;
  top: 12px;
  right: 13px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  background: transparent;
  color: #2d2926;
  font-size: 26px;
  font-weight: 400;
  line-height: 1;
}

.auth-close:hover {
  color: var(--text-brand);
}

.auth-heading {
  padding: 34px 30px 10px;
  text-align: center;
}

.auth-heading--login,
.auth-heading--register {
  padding-bottom: 8px;
}

.auth-kicker {
  margin: 0 0 4px;
  color: var(--text-brand);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .2em;
  text-transform: uppercase;
}

.auth-heading h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -.045em;
  line-height: 1.15;
}

.auth-heading h2 em {
  color: var(--text-brand);
  font-style: italic;
  font-weight: 500;
}

.auth-heading--login > p,
.auth-heading--register > p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.4;
}

.auth-heading--login > p strong,
.auth-heading--register > p strong {
  color: var(--text-brand);
  font-weight: 800;
}

.auth-description {
  margin: 10px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.account-summary {
  padding: 24px 30px 34px;
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
  color: var(--text-on-dark);
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
  color: var(--text-secondary);
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
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.account-summary__details dd {
  margin: 0;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
}

.auth-form {
  display: grid;
  gap: 13px;
  padding: 20px 30px 30px;
}

.auth-form--login {
  gap: 12px;
  padding-top: 7px;
}

.auth-form--register {
  gap: 10px;
  padding-top: 8px;
  padding-bottom: 22px;
}

.auth-form label {
  display: grid;
  gap: 5px;
  color: var(--text-primary);
  font-size: 10px;
  font-weight: 600;
}

.auth-form label span {
  color: var(--text-secondary);
  font-weight: 500;
}

.auth-form input:not([type='checkbox']) {
  width: 100%;
  min-height: 43px;
  border: 1px solid #dedad7;
  border-radius: 6px;
  padding: 10px 13px;
  outline: none;
  color: var(--text-primary);
  font: inherit;
  font-size: 11px;
  font-weight: 500;
  transition: border-color .15s ease, box-shadow .15s ease;
}

.auth-form input:focus {
  border-color: var(--wine);
  box-shadow: 0 0 0 3px rgba(179, 38, 30, .1);
}

.auth-input {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 43px;
  border: 1px solid #dedad7;
  border-radius: 6px;
  color: #8b8581;
  transition: border-color .15s ease, box-shadow .15s ease;
}

.auth-input:focus-within {
  border-color: var(--wine);
  box-shadow: 0 0 0 3px rgba(179, 38, 30, .1);
}

.auth-input > svg {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  margin-left: 12px;
}

.auth-input input:not([type='checkbox']) {
  min-width: 0;
  min-height: 41px;
  border: 0;
  border-radius: 0;
  padding: 9px 10px;
  box-shadow: none;
}

.auth-input input:focus {
  box-shadow: none;
}

.auth-input input::placeholder {
  color: #aaa5a1;
  opacity: 1;
}

.auth-field-hint {
  display: block;
  margin-top: -1px;
  color: #857e79;
  font-size: 8px;
  font-weight: 500;
  line-height: 1.35;
}

.auth-phone-input select {
  min-height: 25px;
  width: 60px;
  flex: 0 0 47px;
  padding: 0 14px 0 3px;
  border: 0;
  border-right: 1px solid #e7e2df;
  border-radius: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-size: 10px;
  font-weight: 600;
}

.auth-phone-input input:not([type='checkbox']) {
  padding-left: 10px;
}

.auth-date-input {
  position: relative;
}

.auth-date-placeholder {
  position: absolute;
  top: 1px;
  right: 2px;
  bottom: 1px;
  left: 36px;
  display: flex;
  align-items: center;
  padding-left: 10px;
  border-radius: 4px;
  background: #fff;
  color: #aaa5a1 !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  pointer-events: none;
}

.auth-password-toggle {
  display: grid;
  width: 33px;
  height: 33px;
  flex: 0 0 33px;
  margin-right: 3px;
  place-items: center;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #807a77;
}

.auth-password-toggle:hover {
  background: #f7f4f1;
  color: var(--text-brand);
}

.auth-password-toggle svg {
  width: 15px;
  height: 15px;
}

.auth-data-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 11px 12px;
  border: 1px solid #e5e1de;
  border-radius: 9px;
  background: #f7f6f5;
}

.auth-data-note > svg {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  margin-top: 1px;
  color: #4d4844;
}

.auth-data-note strong {
  display: block;
  color: #36312e;
  font-size: 9px;
  font-weight: 800;
  line-height: 1.3;
}

.auth-data-note p {
  margin: 3px 0 0;
  color: #7c746f;
  font-size: 7px;
  font-weight: 500;
  line-height: 1.4;
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
  min-height: 42px;
  border: 0;
  border-radius: 6px;
  background: var(--wine);
  color: var(--text-on-dark);
  font-size: 11px;
  font-weight: 700;
  transition: background .15s ease, transform .15s ease;
}

.auth-submit:hover:not(:disabled) {
  background: var(--wine-2);
}

.auth-submit:active:not(:disabled) {
  transform: translateY(1px);
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
  color: var(--text-brand);
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
}

.text-action--right {
  justify-self: end;
}

.auth-switch {
  margin: 3px 0 0;
  color: var(--text-primary);
  text-align: center;
  font-size: 10px;
  font-weight: 600;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 3px 0 0;
  color: #827c78;
  font-size: 9px;
  line-height: 1;
  text-align: center;
}

.auth-divider::before,
.auth-divider::after {
  height: 1px;
  flex: 1;
  background: #e6e2df;
  content: '';
}

.auth-feedback {
  margin: 8px 30px 0;
  border-radius: 6px;
  padding: 9px 10px;
  font-size: 11px;
  line-height: 1.4;
}

.auth-feedback--error {
  background: #fff0f0;
  color: #9c2424;
}

.auth-feedback--success {
  background: var(--wine-wash);
  color: var(--text-brand-dark);
}

.auth-options {
  display: grid;
  gap: 12px;
  padding: 0 30px 30px;
  text-align: center;
}

.auth-options p {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
}

.secondary-option,
.google-button {
  display: grid;
  min-height: 42px;
  place-items: center;
  width: 100%;
  border: 1px solid #e2dedb;
  border-radius: 6px;
  background: #fff;
  color: var(--text-primary);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
}

.google-button {
  overflow: hidden;
}

.google-button:hover {
  border-color: #c9c3bf;
  background: #fdfcfc;
}

.google-button svg {
  width: 15px;
  height: 15px;
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

  .auth-modal__scroll {
    max-height: 100dvh;
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
