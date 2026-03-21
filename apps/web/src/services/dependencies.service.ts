import { apiClient } from './api-client';
import type { TaskDependencies } from '@todo-list-pro/shared';

export const dependenciesService = {
  async get(taskId: string): Promise<TaskDependencies> {
    const res = await apiClient.get(`/tasks/${taskId}/dependencies`);
    return res.data;
  },

  async add(taskId: string, dependsOnId: string) {
    const res = await apiClient.post(`/tasks/${taskId}/dependencies`, { dependsOnId });
    return res.data;
  },

  async remove(taskId: string, dependsOnId: string) {
    await apiClient.delete(`/tasks/${taskId}/dependencies/${dependsOnId}`);
  },
};
