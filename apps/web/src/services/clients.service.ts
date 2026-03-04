import { apiClient } from './api-client';
import type {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  ApiResponse,
  PaginatedResponse,
} from '@todo-list-pro/shared';

export const clientsService = {
  async getAll(page = 1, limit = 50): Promise<PaginatedResponse<Client>> {
    const res = await apiClient.get(`/clients?page=${page}&limit=${limit}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  async getById(id: string): Promise<Client> {
    const res = await apiClient.get<ApiResponse<Client>>(`/clients/${id}`);
    return res.data.data;
  },

  async create(data: CreateClientRequest): Promise<Client> {
    const res = await apiClient.post<ApiResponse<Client>>('/clients', data);
    return res.data.data;
  },

  async update(id: string, data: UpdateClientRequest): Promise<Client> {
    const res = await apiClient.put<ApiResponse<Client>>(`/clients/${id}`, data);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
  },
};
