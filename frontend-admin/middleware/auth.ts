export default defineNuxtRouteMiddleware(() => {
  const { token, hydrate } = useAuth();
  hydrate();
  if (process.client && !token.value) {
    return navigateTo('/login');
  }
});
