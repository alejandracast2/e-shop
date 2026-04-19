<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toErrorMessage } from '@/lib/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const submitting = ref(false)
const errorMessage = ref('')

const loginNotice = computed(() => {
  if (route.query.reason === 'admin_role') {
    return 'Tu usuario no tiene un rol valido para este panel.'
  }

  return ''
})

const redirectTarget = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/',
)

const submit = async () => {
  submitting.value = true
  errorMessage.value = ''

  try {
    await auth.login(form)
    await router.replace(redirectTarget.value)
  } catch (error) {
    errorMessage.value = toErrorMessage(error, 'Credenciales invalidas.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="login-view">
    <article class="panel login-card fade-in">
      <div class="brand">
        <div class="brand-mark">EA</div>
        <div>
          <h1 class="title">Acceso admin</h1>
          <p class="muted">Panel Vue para catalogo, pedidos, pagos y clientes.</p>
        </div>
      </div>

      <div v-if="loginNotice" class="status-message status-message--error">{{ loginNotice }}</div>

      <form class="login-form" @submit.prevent="submit">
        <label class="field">
          <span>Email</span>
          <input v-model.trim="form.email" type="email" autocomplete="username" required />
        </label>

        <label class="field">
          <span>Password</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
          />
        </label>

        <button class="btn btn-primary" type="submit" :disabled="submitting">
          {{ submitting ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div v-if="errorMessage" class="status-message status-message--error">{{ errorMessage }}</div>

      <div class="login-hints">
        <span class="pill">admin@cafedeorigen.com / admin123</span>
        <span class="pill">staff@cafedeorigen.com / admin123</span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-card {
  width: min(460px, 100%);
  display: grid;
  gap: 18px;
}

.login-form {
  display: grid;
  gap: 12px;
}

.login-hints {
  display: grid;
  gap: 8px;
}
</style>
