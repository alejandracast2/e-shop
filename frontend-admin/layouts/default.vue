<template>
  <div class="layout">
    <AdminSidebar />
    <div class="content">
      <AdminTopbar />
      <main>
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.content {
  display: flex;
  flex-direction: column;
}

main {
  padding: 28px 36px 60px;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
