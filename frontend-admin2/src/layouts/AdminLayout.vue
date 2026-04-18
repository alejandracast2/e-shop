<template>
  <div class="admin-shell">
    <AdminSidebar />

    <div class="admin-content">
      <AdminTopbar />
      <main class="admin-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import AdminSidebar from '@/components/AdminSidebar.vue'
import AdminTopbar from '@/components/AdminTopbar.vue'
</script>
