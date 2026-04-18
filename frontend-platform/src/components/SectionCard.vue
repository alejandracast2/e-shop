<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="section-card">
    <header v-if="title || description || $slots.actions" class="section-card__header">
      <div class="section-card__title-wrap">
        <h2 v-if="title">{{ title }}</h2>
        <p v-if="description" class="section-card__description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="section-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="section-card__body">
      <slot />
    </div>
  </section>
</template>
