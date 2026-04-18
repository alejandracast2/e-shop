<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  tone: {
    type: String,
    default: 'neutral',
  },
})

const toneClass = computed(() => `status-badge--${props.tone || 'neutral'}`)
</script>

<template>
  <span class="status-badge" :class="toneClass">{{ label }}</span>
</template>
