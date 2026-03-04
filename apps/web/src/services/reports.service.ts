import { apiClient } from './api-client';
import type { ReportStats, AdminReportStats, ApiResponse } from '@todo-list-pro/shared';

interface ReportParams {
  period: string;
  year: number;
  month?: number;
  week?: number;
}

interface AdminReportParams extends ReportParams {
  userId?: string;
}

function buildQuery(entries: [string, string | number | undefined][]): string {
  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value !== undefined && value !== '') search.append(key, String(value));
  }
  return search.toString();
}

export const reportsService = {
  async getMyStats(params: ReportParams): Promise<ReportStats> {
    const query = buildQuery([
      ['period', params.period],
      ['year', params.year],
      ['month', params.month],
      ['week', params.week],
    ]);
    const res = await apiClient.get<ApiResponse<ReportStats>>(`/reports/my-stats?${query}`);
    return res.data.data;
  },

  async getAdminStats(params: AdminReportParams): Promise<AdminReportStats> {
    const query = buildQuery([
      ['period', params.period],
      ['year', params.year],
      ['month', params.month],
      ['week', params.week],
      ['userId', params.userId],
    ]);
    const res = await apiClient.get<ApiResponse<AdminReportStats>>(`/reports/admin-stats?${query}`);
    return res.data.data;
  },
};
