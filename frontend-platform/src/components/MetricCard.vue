<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  value: {
    type: [String, Number],
    default: '',
  },
  note: {
    type: String,
    default: '',
  },
  tone: {
    type: String,
    default: 'accent',
  },
})
</script>

<template>
  <article class="metric-card" :class="`metric-card--${tone}`">
    <p class="metric-card__eyebrow">{{ eyebrow }}</p>
    <strong class="metric-card__value">{{ value }}</strong>
    <p class="metric-card__note">{{ note }}</p>
  </article>
</template>
