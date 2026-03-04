export interface TaskList {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  isPinned: boolean;
  order: number;
  clientId: string | null;
  client?: { id: string; name: string; color: string } | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number };
}

export interface CreateListRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  clientId?: string;
}

export interface UpdateListRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  clientId?: string | null;
}
