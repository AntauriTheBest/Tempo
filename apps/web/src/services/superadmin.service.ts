import { apiClient } from './api-client';
import type { ApiResponse } from '@todo-list-pro/shared';

export interface OrgStat {
  id: string;
  name: string;
  slug: string;
  plan: 'TRIAL' | 'PRO' | 'ENTERPRISE';
  status: 'TRIALING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  trialEndsAt: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  totalUsers: number;
  activeUsers: number;
  taskCount: number;
  attachmentCount: number;
  diskUsageBytes: number;
}

export interface GlobalStats {
  totalOrgs: number;
  totalUsers: number;
  totalTasks: number;
  totalAttachments: number;
  diskUsageBytes: number;
}

export interface OrgDetail extends OrgStat {
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }[];
}

export const superadminService = {
  async getStats(): Promise<GlobalStats> {
    const res = await apiClient.get<ApiResponse<GlobalStats>>('/superadmin/stats');
    return res.data.data;
  },

  async listOrgs(): Promise<OrgStat[]> {
    const res = await apiClient.get<ApiResponse<OrgStat[]>>('/superadmin/orgs');
    return res.data.data;
  },

  async getOrg(id: string): Promise<OrgDetail> {
    const res = await apiClient.get<ApiResponse<OrgDetail>>(`/superadmin/orgs/${id}`);
    return res.data.data;
  },

  async updateOrg(
    id: string,
    data: { status?: string; plan?: string; trialEndsAt?: string }
  ): Promise<void> {
    await apiClient.patch(`/superadmin/orgs/${id}`, data);
  },
};
