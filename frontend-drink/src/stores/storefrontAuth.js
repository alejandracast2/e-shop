import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'

export const CUSTOMER_SESSION_STORAGE_KEY = 'frontend-drink-customer-session'

function resolveError(error, fallback) {
  return error instanceof Error ? error.message : fallback
}

export const useStorefrontAuthStore = defineStore('storefrontAuth', () => {
  const accessToken = ref('')
  const user = ref(null)
  const customer = ref(null)
  const requiresAgeConfirmation = ref(false)
  const loading = ref(false)
  const error = ref('')
  const message = ref('')

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value?.id))
  const customerName = computed(() => user.value?.name || user.value?.email || 'Cuenta')

  function restoreSession() {
    if (typeof window === 'undefined') return

    try {
      const session = JSON.parse(window.localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY) || '{}')
      accessToken.value = session.accessToken || ''
      user.value = session.user || null
      customer.value = session.customer || null
      requiresAgeConfirmation.value = Boolean(session.requiresAgeConfirmation)
    } catch {
      clearSession()
    }
  }

  function saveSession(response) {
    accessToken.value = response.accessToken || ''
    user.value = response.user || null
    customer.value = response.customer || null
    requiresAgeConfirmation.value = Boolean(response.requiresAgeConfirmation)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        CUSTOMER_SESSION_STORAGE_KEY,
        JSON.stringify({
          accessToken: accessToken.value,
          user: user.value,
          customer: customer.value,
          requiresAgeConfirmation: requiresAgeConfirmation.value,
        }),
      )
    }
  }

  function clearSession() {
    accessToken.value = ''
    user.value = null
    customer.value = null
    requiresAgeConfirmation.value = false
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY)
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
    accessToken,
    user,
    customer,
    requiresAgeConfirmation,
    loading,
    error,
    message,
    isAuthenticated,
    customerName,
    restoreSession,
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
