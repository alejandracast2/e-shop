<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL, toErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

const loading = ref(false)
const errorMessage = ref('')

const routeNotice = computed(() => {
  if (route.query.reason === 'platform_admin') {
    return 'La sesion previa no tenia el rol platform_admin requerido por esta aplicacion.'
  }

  return ''
})

const fillSeedCredentials = () => {
  form.email = 'platform@eshop.com'
  form.password = 'admin123'
}

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    await auth.login({
      email: form.email,
      password: form.password,
    })

    const redirectPath =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/'

    router.push(redirectPath)
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'No fue posible iniciar sesion.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-side">
      <div class="auth-side__grid">
        <div class="stack-sm">
          <p class="eyebrow">E-Shop platform frontend</p>
          <h1 class="page-title">Operaciones de plataforma sin salir del navegador</h1>
          <p class="auth-side__copy">
            Panel creado para usuarios con rol <span class="mono">platform_admin</span>.
            Desde aqui se pueden administrar tenants, stores y usuarios usando la
            API protegida del backend.
          </p>
        </div>

        <div class="auth-side__panel">
          <h3>Que puedes hacer aqui</h3>
          <ul>
            <li>Crear y listar tenants.</li>
            <li>Crear stores dentro de cualquier tenant.</li>
            <li>Administrar usuarios mediante CRUD completo.</li>
            <li>Consultar el mapa de endpoints realmente soportados.</li>
          </ul>
        </div>

        <div class="auth-side__panel">
          <h3>Backend esperado</h3>
          <p>API base actual: <span class="mono">{{ API_BASE_URL }}</span></p>
          <p>Si necesitas otra URL, define <span class="mono">VITE_API_URL</span>.</p>
        </div>
      </div>
    </section>

    <section class="auth-card">
      <div class="auth-card__header">
        <p class="eyebrow">Ingreso</p>
        <h1>Iniciar sesion</h1>
        <p>El login valida las credenciales contra <span class="mono">POST /auth/login</span>.</p>
      </div>

      <div v-if="routeNotice" class="notice notice--error">{{ routeNotice }}</div>
      <div v-if="errorMessage" class="notice notice--error">{{ errorMessage }}</div>

      <form class="form-grid" @submit.prevent="handleLogin">
        <label class="field">
          <span>Email</span>
          <input
            v-model.trim="form.email"
            type="email"
            autocomplete="username"
            placeholder="platform@eshop.com"
            required
          />
        </label>

        <label class="field">
          <span>Password</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="admin123"
            required
          />
        </label>

        <div class="toolbar">
          <button class="button button--primary" type="submit" :disabled="loading">
            {{ loading ? 'Ingresando...' : 'Entrar al panel' }}
          </button>
          <button class="button button--secondary" type="button" @click="fillSeedCredentials">
            Usar credenciales seed
          </button>
        </div>
      </form>

      <div class="auth-card__footer">
        <p>
          Credenciales seed conocidas:
          <span class="mono">platform@eshop.com / admin123</span>
        </p>
        <p>
          Esta interfaz rechaza usuarios sin rol
          <span class="mono">platform_admin</span>.
        </p>
      </div>
    </section>
  </div>
</template>
