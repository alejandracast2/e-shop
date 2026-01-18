type AuthUser = {
  id: string;
  name: string;
  email: string;
  roles?: Array<{ role: string; tenantId?: string; storeId?: string }>;
};

const TOKEN_KEY = 'eshop-admin-token';
const USER_KEY = 'eshop-admin-user';

export const useAuth = () => {
  const token = useState<string | null>('auth-token', () => null);
  const user = useState<AuthUser | null>('auth-user', () => null);

  const hydrate = () => {
    if (!process.client || token.value) return;
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);
    if (storedToken) token.value = storedToken;
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser) as AuthUser;
      } catch {
        user.value = null;
      }
    }
  };

  const setAuth = (nextToken: string, nextUser: AuthUser) => {
    token.value = nextToken;
    user.value = nextUser;
    if (process.client) {
      window.localStorage.setItem(TOKEN_KEY, nextToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    }
  };

  const clearAuth = () => {
    token.value = null;
    user.value = null;
    if (process.client) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
  };

  const authHeaders = computed(() =>
    token.value ? { Authorization: `Bearer ${token.value}` } : {},
  );

  return { token, user, hydrate, setAuth, clearAuth, authHeaders };
};
