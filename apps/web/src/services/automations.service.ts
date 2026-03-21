import { apiClient } from './api-client';
import type { Automation, CreateAutomationRequest } from '@todo-list-pro/shared';

export const automationsService = {
  async getAll(): Promise<Automation[]> {
    const res = await apiClient.get('/automations');
    return res.data;
  },

  async create(data: CreateAutomationRequest): Promise<Automation> {
    const res = await apiClient.post('/automations', data);
    return res.data;
  },

  async update(id: string, data: Partial<Automation>): Promise<Automation> {
    const res = await apiClient.put(`/automations/${id}`, data);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/automations/${id}`);
  },
};
