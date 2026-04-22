import { ref } from 'vue'
import { defineStore } from 'pinia'

import { storefrontRequest } from '../lib/storefrontApi'

export const useStorefrontPaymentsStore = defineStore('storefrontPayments', () => {
  const paymentMethods = ref([])
  const proofSubmission = ref(null)
  const loadingMethods = ref(false)
  const submittingProof = ref(false)
  const methodsError = ref('')
  const proofError = ref('')

  async function loadPaymentMethods() {
    loadingMethods.value = true
    methodsError.value = ''

    try {
      const data = await storefrontRequest('/storefront/payments/methods')
      paymentMethods.value = Array.isArray(data) ? data : []
      return paymentMethods.value
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'No se pudieron cargar los metodos de pago.'
      methodsError.value = message
      paymentMethods.value = []
      return paymentMethods.value
    } finally {
      loadingMethods.value = false
    }
  }

  async function submitPaymentProof(intentId, payload) {
    if (!intentId) {
      proofError.value = 'Payment intent id is required.'
      proofSubmission.value = null
      return null
    }

    submittingProof.value = true
    proofError.value = ''

    try {
      const data = await storefrontRequest(`/storefront/payments/${intentId}/proof`, {
        method: 'POST',
        body: payload,
      })

      proofSubmission.value = data ?? null
      return proofSubmission.value
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'No se pudo enviar el comprobante.'
      proofError.value = message
      proofSubmission.value = null
      return proofSubmission.value
    } finally {
      submittingProof.value = false
    }
  }

  function resetPayments() {
    paymentMethods.value = []
    proofSubmission.value = null
    methodsError.value = ''
    proofError.value = ''
  }

  return {
    paymentMethods,
    proofSubmission,
    loadingMethods,
    submittingProof,
    methodsError,
    proofError,
    loadPaymentMethods,
    submitPaymentProof,
    resetPayments,
  }
})
