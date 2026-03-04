import { apiClient } from './api-client';
import type {
  TimeEntry,
  CreateTimeEntryRequest,
  TaskTimeStats,
  ApiResponse,
} from '@todo-list-pro/shared';

export const timeTrackingService = {
  async create(data: CreateTimeEntryRequest): Promise<TimeEntry> {
    const res = await apiClient.post<ApiResponse<TimeEntry>>(
      '/time-entries',
      data
    );
    return res.data.data;
  },

  async getByTask(
    taskId: string
  ): Promise<{ entries: TimeEntry[]; stats: TaskTimeStats }> {
    const res = await apiClient.get<
      ApiResponse<{ entries: TimeEntry[]; stats: TaskTimeStats }>
    >(`/time-entries/task/${taskId}`);
    return res.data.data;
  },

  async updateEstimate(
    taskId: string,
    estimatedTimeMinutes: number | null
  ): Promise<void> {
    await apiClient.patch(`/time-entries/task/${taskId}/estimate`, {
      estimatedTimeMinutes,
    });
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/time-entries/${id}`);
  },
};
