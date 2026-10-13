import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import { useStorefrontAuthStore } from './stores/storefrontAuth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// The HttpOnly session cookie is restored once at startup. No token or customer
// profile is persisted in browser storage.
void useStorefrontAuthStore(pinia).restoreSession()

app.mount('#app')
