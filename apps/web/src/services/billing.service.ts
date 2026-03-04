import { apiClient } from './api-client';
import type { ApiResponse, BillingStatus } from '@todo-list-pro/shared';

export const billingService = {
  async getStatus(): Promise<BillingStatus> {
    const res = await apiClient.get<ApiResponse<BillingStatus>>('/billing/status');
    return res.data.data;
  },
  async createCheckoutSession(): Promise<{ url: string }> {
    const res = await apiClient.post<ApiResponse<{ url: string }>>('/billing/checkout');
    return res.data.data;
  },
  async createPortalSession(): Promise<{ url: string }> {
    const res = await apiClient.post<ApiResponse<{ url: string }>>('/billing/portal');
    return res.data.data;
  },
};
