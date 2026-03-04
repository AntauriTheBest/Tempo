import { apiClient } from './api-client';
import type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  ApiResponse,
} from '@todo-list-pro/shared';

export const commentsService = {
  async getByTask(taskId: string): Promise<Comment[]> {
    const res = await apiClient.get<ApiResponse<Comment[]>>(
      `/tasks/${taskId}/comments`
    );
    return res.data.data;
  },

  async create(taskId: string, data: CreateCommentRequest): Promise<Comment> {
    const res = await apiClient.post<ApiResponse<Comment>>(
      `/tasks/${taskId}/comments`,
      data
    );
    return res.data.data;
  },

  async update(commentId: string, data: UpdateCommentRequest): Promise<Comment> {
    const res = await apiClient.put<ApiResponse<Comment>>(
      `/comments/${commentId}`,
      data
    );
    return res.data.data;
  },

  async remove(commentId: string): Promise<void> {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
