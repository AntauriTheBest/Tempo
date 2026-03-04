import { apiClient } from './api-client';
import type {
  Task,
  Attachment,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  UpdateTaskStatusRequest,
  MoveTaskRequest,
  ReorderRequest,
  ApiResponse,
  PaginatedResponse,
} from '@todo-list-pro/shared';

export const tasksService = {
  async getAll(
    filters: TaskFilters = {}
  ): Promise<PaginatedResponse<Task>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const res = await apiClient.get(`/tasks?${params.toString()}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  async getById(id: string): Promise<Task> {
    const res = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return res.data.data;
  },

  async create(data: CreateTaskRequest): Promise<Task> {
    const res = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    return res.data.data;
  },

  async update(id: string, data: UpdateTaskRequest): Promise<Task> {
    const res = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async updateStatus(id: string, data: UpdateTaskStatusRequest): Promise<Task> {
    const res = await apiClient.patch<ApiResponse<Task>>(
      `/tasks/${id}/status`,
      data
    );
    return res.data.data;
  },

  async move(id: string, data: MoveTaskRequest): Promise<Task> {
    const res = await apiClient.patch<ApiResponse<Task>>(
      `/tasks/${id}/move`,
      data
    );
    return res.data.data;
  },

  async reorder(data: ReorderRequest): Promise<void> {
    await apiClient.patch('/tasks/reorder', data);
  },

  async createSubtask(
    parentId: string,
    data: CreateTaskRequest
  ): Promise<Task> {
    const res = await apiClient.post<ApiResponse<Task>>(
      `/tasks/${parentId}/subtasks`,
      data
    );
    return res.data.data;
  },

  async duplicate(id: string): Promise<Task> {
    const res = await apiClient.post<ApiResponse<Task>>(
      `/tasks/${id}/duplicate`
    );
    return res.data.data;
  },

  async getAttachments(taskId: string): Promise<Attachment[]> {
    const res = await apiClient.get<ApiResponse<Attachment[]>>(`/tasks/${taskId}/attachments`);
    return res.data.data;
  },

  async uploadAttachment(taskId: string, file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<Attachment>>(
      `/tasks/${taskId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  async deleteAttachment(taskId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  },
};
