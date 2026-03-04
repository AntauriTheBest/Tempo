import { create } from 'zustand';
import type { UserProfile, Organization } from '@todo-list-pro/shared';

interface AuthState {
  user: UserProfile | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _initialized: boolean;
  setUser: (user: UserProfile | null) => void;
  setOrganization: (org: Organization | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: true,
  _initialized: false,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),
  setOrganization: (organization) => set({ organization }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: () => set({ _initialized: true }),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, organization: null, isAuthenticated: false });
  },
}));
