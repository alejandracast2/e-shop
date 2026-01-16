<template>
  <span class="brand-mark" aria-hidden="true">
    <svg viewBox="0 0 120 120" role="img">
      <circle cx="60" cy="60" r="52" fill="#2f3b2b" />
      <path
        d="M30 44c10-10 30-16 50-8 14 5 20 19 10 30-9 11-28 16-48 6"
        fill="none"
        stroke="#f4b266"
        stroke-width="6"
        stroke-linecap="round"
      />
      <path
        d="M32 76c12 8 34 10 56-2"
        fill="none"
        stroke="#f8f4ef"
        stroke-width="6"
        stroke-linecap="round"
      />
    </svg>
  </span>
</template>

<style scoped>
.brand-mark {
  display: inline-flex;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 12px 20px rgba(47, 59, 43, 0.25);
}

svg {
  width: 100%;
  height: 100%;
}
</style>
