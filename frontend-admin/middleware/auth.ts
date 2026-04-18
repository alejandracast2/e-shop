export default defineNuxtRouteMiddleware(async () => {
  const { token, hydrate } = useAuth();
  const { ensureStoreContext } = useAdminContext();
  hydrate();
  if (process.client && !token.value) {
    return navigateTo('/login');
  }
  if (process.client && token.value) {
    await ensureStoreContext();
  }
});
