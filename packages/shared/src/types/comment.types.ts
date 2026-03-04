export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}
