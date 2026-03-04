import { apiClient } from './api-client';
import type {
  AdminUserListItem,
  InviteUserRequest,
  AdminUpdateUserRequest,
  MonthlyClientReport,
  ApiResponse,
  PaginatedResponse,
} from '@todo-list-pro/shared';

export const adminService = {
  async getUsers(page = 1, limit = 50): Promise<PaginatedResponse<AdminUserListItem>> {
    const res = await apiClient.get(`/admin/users?page=${page}&limit=${limit}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  async getUserById(id: string): Promise<AdminUserListItem> {
    const res = await apiClient.get<ApiResponse<AdminUserListItem>>(`/admin/users/${id}`);
    return res.data.data;
  },

  async inviteUser(data: InviteUserRequest): Promise<{ user: AdminUserListItem; invitationUrl: string }> {
    const res = await apiClient.post<ApiResponse<{ user: AdminUserListItem; invitationUrl: string }>>('/admin/users/invite', data);
    return res.data.data;
  },

  async updateUser(id: string, data: AdminUpdateUserRequest): Promise<AdminUserListItem> {
    const res = await apiClient.patch<ApiResponse<AdminUserListItem>>(`/admin/users/${id}`, data);
    return res.data.data;
  },

  async resendInvitation(id: string): Promise<{ invitationUrl: string }> {
    const res = await apiClient.post<ApiResponse<{ invitationUrl: string }>>(`/admin/users/${id}/resend-invitation`);
    return res.data.data;
  },

  async getTasks(filters: {
    status?: string;
    userId?: string;
    search?: string;
    priority?: string;
    sortBy?: string;
    sortDir?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params.append(key, String(value));
    }
    const res = await apiClient.get(`/admin/tasks?${params.toString()}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalTasks: number;
    tasksByStatus: Record<string, number>;
  }> {
    const res = await apiClient.get<ApiResponse<any>>('/admin/stats');
    return res.data.data;
  },

  // Recurrence / Igualas
  async generateMonthlyTasks(year: number, month: number): Promise<{ generated: number; skipped: number; total: number }> {
    const res = await apiClient.post<ApiResponse<any>>('/admin/recurrence/generate', { year, month });
    return res.data.data;
  },

  async getMonthlyReport(year: number, month: number): Promise<MonthlyClientReport[]> {
    const res = await apiClient.get<ApiResponse<MonthlyClientReport[]>>(`/admin/recurrence/report?year=${year}&month=${month}`);
    return res.data.data;
  },

  async getClientMonthlyDetail(clientId: string, year: number, month: number): Promise<MonthlyClientReport> {
    const res = await apiClient.get<ApiResponse<MonthlyClientReport>>(`/admin/recurrence/clients/${clientId}?year=${year}&month=${month}`);
    return res.data.data;
  },
};
