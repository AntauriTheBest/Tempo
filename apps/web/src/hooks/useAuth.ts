import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';
import type { LoginRequest, SetPasswordRequest } from '@todo-list-pro/shared';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const organization = useAuthStore((s) => s.organization);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const _initialized = useAuthStore((s) => s._initialized);
  const setUser = useAuthStore((s) => s.setUser);
  const setOrganization = useAuthStore((s) => s.setOrganization);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const storeLogout = useAuthStore((s) => s.logout);

  const isAdmin = user?.role === 'ADMIN';

  // Session restoration — runs only once thanks to _initialized guard
  useEffect(() => {
    if (_initialized) return;
    setInitialized();

    const token = localStorage.getItem('accessToken');
    if (token) {
      authService
        .getMe()
        .then((u) => setUser(u))
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, [_initialized, setInitialized, setUser]);

  const login = useCallback(
    async (data: LoginRequest) => {
      const result = await authService.login(data);
      localStorage.setItem('accessToken', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      setUser(result.user);
      setOrganization(result.organization ?? null);
      return result;
    },
    [setUser, setOrganization]
  );

  const register = useCallback(
    async (data: { orgName: string; name: string; email: string; password: string }) => {
      const result = await authService.register(data);
      localStorage.setItem('accessToken', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      setUser(result.user);
      setOrganization(result.organization ?? null);
      return result;
    },
    [setUser, setOrganization]
  );

  const setPassword = useCallback(
    async (data: SetPasswordRequest) => {
      const result = await authService.setPassword(data);
      localStorage.setItem('accessToken', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      setUser(result.user);
      return result;
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    storeLogout();
  }, [storeLogout]);

  return {
    user,
    organization,
    isAuthenticated,
    isLoading,
    isAdmin,
    login,
    register,
    setPassword,
    logout,
  };
}
