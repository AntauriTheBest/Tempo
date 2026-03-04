import { apiClient } from './api-client';
import type {
  Tag,
  CreateTagRequest,
  UpdateTagRequest,
  ApiResponse,
  PaginatedResponse,
} from '@todo-list-pro/shared';

export const tagsService = {
  async getAll(page = 1, limit = 50): Promise<PaginatedResponse<Tag>> {
    const res = await apiClient.get(`/tags?page=${page}&limit=${limit}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  async create(data: CreateTagRequest): Promise<Tag> {
    const res = await apiClient.post<ApiResponse<Tag>>('/tags', data);
    return res.data.data;
  },

  async update(id: string, data: UpdateTagRequest): Promise<Tag> {
    const res = await apiClient.put<ApiResponse<Tag>>(`/tags/${id}`, data);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/tags/${id}`);
  },
};
