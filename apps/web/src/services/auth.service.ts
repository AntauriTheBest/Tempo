import { apiClient } from './api-client';
import type {
  LoginRequest,
  SetPasswordRequest,
  AuthTokens,
  UserProfile,
  Organization,
  ApiResponse,
} from '@todo-list-pro/shared';

export const authService = {
  async login(
    data: LoginRequest
  ): Promise<{ user: UserProfile; organization: Organization; tokens: AuthTokens }> {
    const res = await apiClient.post<
      ApiResponse<{ user: UserProfile; organization: Organization; tokens: AuthTokens }>
    >('/auth/login', data);
    return res.data.data;
  },

  async register(data: {
    orgName: string;
    name: string;
    email: string;
    password: string;
  }): Promise<{ user: UserProfile; organization: Organization; tokens: AuthTokens }> {
    const res = await apiClient.post<
      ApiResponse<{ user: UserProfile; organization: Organization; tokens: AuthTokens }>
    >('/auth/register', data);
    return res.data.data;
  },

  async setPassword(
    data: SetPasswordRequest
  ): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const res = await apiClient.post<
      ApiResponse<{ user: UserProfile; tokens: AuthTokens }>
    >('/auth/set-password', data);
    return res.data.data;
  },

  async getMe(): Promise<UserProfile> {
    const res = await apiClient.get<ApiResponse<UserProfile>>('/auth/me');
    return res.data.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(
    token: string,
    password: string
  ): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const res = await apiClient.post<
      ApiResponse<{ user: UserProfile; tokens: AuthTokens }>
    >('/auth/reset-password', { token, password });
    return res.data.data;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await apiClient
        .post('/auth/logout', { refreshToken })
        .catch(() => {});
    }
  },
};
