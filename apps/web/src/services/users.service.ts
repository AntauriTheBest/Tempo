import { apiClient } from './api-client';
import type {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ApiResponse,
} from '@todo-list-pro/shared';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export const usersService = {
  async getAll(): Promise<UserSummary[]> {
    const res = await apiClient.get<ApiResponse<UserSummary[]>>('/users');
    return res.data.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const res = await apiClient.patch<ApiResponse<UserProfile>>(
      '/users/me',
      data
    );
    return res.data.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.patch('/users/me/password', data);
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/users/me');
  },
};
