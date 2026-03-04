import { apiClient } from './api-client';
import type {
  TaskList,
  CreateListRequest,
  UpdateListRequest,
  ReorderRequest,
  ApiResponse,
  PaginatedResponse,
} from '@todo-list-pro/shared';

export const listsService = {
  async getAll(page = 1, limit = 50): Promise<PaginatedResponse<TaskList>> {
    const res = await apiClient.get(`/lists?page=${page}&limit=${limit}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  async getById(id: string): Promise<TaskList & { tasks: any[] }> {
    const res = await apiClient.get<ApiResponse<TaskList & { tasks: any[] }>>(
      `/lists/${id}`
    );
    return res.data.data;
  },

  async create(data: CreateListRequest): Promise<TaskList> {
    const res = await apiClient.post<ApiResponse<TaskList>>('/lists', data);
    return res.data.data;
  },

  async update(id: string, data: UpdateListRequest): Promise<TaskList> {
    const res = await apiClient.put<ApiResponse<TaskList>>(
      `/lists/${id}`,
      data
    );
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/lists/${id}`);
  },

  async togglePin(id: string): Promise<TaskList> {
    const res = await apiClient.patch<ApiResponse<TaskList>>(
      `/lists/${id}/pin`
    );
    return res.data.data;
  },

  async reorder(data: ReorderRequest): Promise<void> {
    await apiClient.patch('/lists/reorder', data);
  },
};
