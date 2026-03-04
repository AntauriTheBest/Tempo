import { apiClient } from './api-client';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ReorderRequest,
  ApiResponse,
  PaginatedResponse,
} from '@todo-list-pro/shared';

export const categoriesService = {
  async getAll(page = 1, limit = 50): Promise<PaginatedResponse<Category>> {
    const res = await apiClient.get(
      `/categories?page=${page}&limit=${limit}`
    );
    return { data: res.data.data, meta: res.data.meta };
  },

  async create(data: CreateCategoryRequest): Promise<Category> {
    const res = await apiClient.post<ApiResponse<Category>>(
      '/categories',
      data
    );
    return res.data.data;
  },

  async update(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const res = await apiClient.put<ApiResponse<Category>>(
      `/categories/${id}`,
      data
    );
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },

  async reorder(data: ReorderRequest): Promise<void> {
    await apiClient.patch('/categories/reorder', data);
  },
};
