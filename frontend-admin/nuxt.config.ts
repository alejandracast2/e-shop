// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  srcDir: '.',
  devtools: { enabled: true },
  css: ['~/app/assets/admin.css'],
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL ?? 'http://localhost:4000',
      storeSlug: process.env.NUXT_PUBLIC_STORE_SLUG ?? 'default',
    },
  },
})
