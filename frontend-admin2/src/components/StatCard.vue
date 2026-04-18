<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  trend: {
    type: String,
    default: '',
  },
  footer: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <article class="panel stat-card">
    <div class="stat-card__top">
      <span class="muted">{{ label }}</span>
      <span v-if="trend" class="pill">{{ trend }}</span>
    </div>
    <strong class="stat-card__value">{{ value }}</strong>
    <span v-if="footer" class="muted stat-card__footer">{{ footer }}</span>
  </article>
</template>
