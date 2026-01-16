<template>
  <div class="card stat-card">
    <div class="stat-header">
      <span class="muted">{{ label }}</span>
      <span class="pill">{{ trend }}</span>
    </div>
    <div class="stat-value">{{ value }}</div>
    <div class="stat-footer muted">{{ footer }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  trend: string;
  footer: string;
}>();
</script>

<style scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-footer {
  font-size: 12px;
}
</style>
