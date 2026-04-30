import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'

export const useStorefrontUiStore = defineStore('storefrontUi', () => {
  const cartOpen = ref(false)
  const toast = reactive({
    visible: false,
    message: '',
  })

  let toastTimerId = 0

  function openCart() {
    cartOpen.value = true
  }

  function closeCart() {
    cartOpen.value = false
  }

  function showToast(message) {
    toast.message = message
    toast.visible = true

    if (typeof window === 'undefined') return

    window.clearTimeout(toastTimerId)
    toastTimerId = window.setTimeout(() => {
      toast.visible = false
    }, 2200)
  }

  return {
    cartOpen,
    toast,
    openCart,
    closeCart,
    showToast,
  }
})
