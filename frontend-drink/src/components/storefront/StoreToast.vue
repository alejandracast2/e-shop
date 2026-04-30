<script setup>
import { useStorefrontUiStore } from '../../stores/storefrontUi'

const uiStore = useStorefrontUiStore()
</script>

<template>
  <div class="toast" :class="{ visible: uiStore.toast.visible }">
    {{ uiStore.toast.message }}
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 75;
  padding: 14px 18px;
  border-radius: 999px;
  background: #12100f;
  color: #faf7f2;
  box-shadow: 0 20px 44px -30px rgba(0, 0, 0, 0.6);
  transform: translate(-50%, 16px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast.visible {
  opacity: 1;
  transform: translate(-50%, 0);
}
</style>
