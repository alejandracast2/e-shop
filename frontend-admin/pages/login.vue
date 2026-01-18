<template>
  <section class="login">
    <div class="card login-card">
      <div class="brand">
        <div class="brand-mark">A</div>
        <div>
          <h1 class="title">Acceso Admin</h1>
          <p class="muted">Ingresa con tus credenciales de prueba.</p>
        </div>
      </div>
      <form class="form" @submit.prevent="submit">
        <label>
          Email
          <input v-model="email" type="email" required />
        </label>
        <label>
          Password
          <input v-model="password" type="password" required />
        </label>
        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </form>
      <div class="hint">
        <div class="pill">admin@cafedeorigen.com / admin123</div>
        <div class="pill">staff@cafedeorigen.com / admin123</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const config = useRuntimeConfig();
const router = useRouter();
const { setAuth } = useAuth();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const submit = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await $fetch<{ accessToken: string; user: any }>(
      '/auth/login',
      {
        baseURL: config.public.apiUrl,
        method: 'POST',
        body: { email: email.value, password: password.value },
      },
    );
    setAuth(response.accessToken, response.user);
    await router.push('/');
  } catch (error) {
    errorMessage.value = 'Credenciales invalidas.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
}

.login-card {
  max-width: 420px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

input {
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 10px 12px;
  font-family: inherit;
}

.error {
  color: #b91c1c;
  margin: 0;
}

.hint {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
