import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'

const LEGACY_CUSTOMER_SESSION_STORAGE_KEY = 'frontend-drink-customer-session'

function resolveError(error, fallback) {
  return error instanceof Error ? error.message : fallback
}

export const useStorefrontAuthStore = defineStore('storefrontAuth', () => {
  const user = ref(null)
  const customer = ref(null)
  const customerProfile = ref(null)
  const requiresAgeConfirmation = ref(false)
  const loading = ref(false)
  const error = ref('')
  const message = ref('')
  let restoreSessionPromise = null

  const isAuthenticated = computed(() => Boolean(user.value?.id))
  const customerName = computed(() => customer.value?.fullName || user.value?.name || user.value?.email || 'Cuenta')

  function removeLegacySession() {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.removeItem(LEGACY_CUSTOMER_SESSION_STORAGE_KEY)
    } catch {}
  }

  function saveSession(response) {
    user.value = response.user || null
    customer.value = response.customer || null
    customerProfile.value = null
    requiresAgeConfirmation.value = Boolean(response.requiresAgeConfirmation)
  }

  function resetSession() {
    user.value = null
    customer.value = null
    customerProfile.value = null
    requiresAgeConfirmation.value = false
  }

  async function restoreSession() {
    removeLegacySession()
    if (restoreSessionPromise) return restoreSessionPromise

    restoreSessionPromise = (async () => {
      try {
        const response = await storefrontRequest('/auth/customer/session')
        saveSession(response)
        return response
      } catch {
        resetSession()
        return null
      } finally {
        restoreSessionPromise = null
      }
    })()

    return restoreSessionPromise
  }

  async function loadCustomerProfile() {
    if (!isAuthenticated.value) return null

    try {
      const response = await storefrontRequest('/auth/customer/profile')
      customerProfile.value = response.customer || null
      return customerProfile.value
    } catch (requestError) {
      error.value = resolveError(requestError, 'No fue posible cargar tu perfil.')
      return null
    }
  }

  async function clearSession() {
    resetSession()
    removeLegacySession()
    try {
      await storefrontRequest('/auth/customer/logout', { method: 'POST' })
    } catch {
      // The browser state is already cleared; a failed logout must not restore it.
    }
  }

  async function authenticate(path, body) {
    loading.value = true
    error.value = ''
    message.value = ''
    try {
      const response = await storefrontRequest(path, { method: 'POST', body })
      saveSession(response)
      return response
    } catch (requestError) {
      error.value = resolveError(requestError, 'No fue posible iniciar sesión.')
      return null
    } finally {
      loading.value = false
    }
  }

  function login(email, password) {
    return authenticate('/auth/customer/login', { email, password })
  }

  function register(payload) {
    return authenticate('/auth/customer/register', payload)
  }

  function loginWithGoogle(credential) {
    return authenticate('/auth/customer/google', { credential })
  }

  async function requestEmailCode(email, purpose) {
    loading.value = true
    error.value = ''
    message.value = ''
    try {
      const response = await storefrontRequest('/auth/customer/email-code/request', {
        method: 'POST',
        body: { email, purpose },
      })
      message.value = response?.message || 'Revisa tu correo para continuar.'
      return true
    } catch (requestError) {
      error.value = resolveError(requestError, 'No fue posible enviar el código.')
      return false
    } finally {
      loading.value = false
    }
  }

  function verifyEmailCode(email, code) {
    return authenticate('/auth/customer/email-code/verify', { email, code })
  }

  async function resetPassword(email, code, password) {
    loading.value = true
    error.value = ''
    message.value = ''
    try {
      const response = await storefrontRequest('/auth/customer/password/reset', {
        method: 'POST',
        body: { email, code, password },
      })
      message.value = response?.message || 'Contraseña actualizada.'
      return true
    } catch (requestError) {
      error.value = resolveError(requestError, 'No fue posible actualizar la contraseña.')
      return false
    } finally {
      loading.value = false
    }
  }

  async function completeAgeProfile(payload) {
    loading.value = true
    error.value = ''
    message.value = ''
    try {
      const response = await storefrontRequest('/auth/customer/profile', {
        method: 'PATCH',
        body: payload,
      })
      saveSession(response)
      return response
    } catch (requestError) {
      error.value = resolveError(requestError, 'No fue posible verificar tu edad.')
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    customer,
    customerProfile,
    requiresAgeConfirmation,
    loading,
    error,
    message,
    isAuthenticated,
    customerName,
    restoreSession,
    loadCustomerProfile,
    clearSession,
    login,
    register,
    loginWithGoogle,
    requestEmailCode,
    verifyEmailCode,
    resetPassword,
    completeAgeProfile,
  }
})
