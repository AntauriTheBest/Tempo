export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  _count?: { tasks: number };
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}
