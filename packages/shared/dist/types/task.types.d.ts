import type { RecurrenceRule, CreateRecurrenceRequest } from './recurrence.types';
export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export interface Attachment {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    createdAt: string;
    url: string;
    userId: string;
}
export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    completedAt: string | null;
    order: number;
    categoryId: string | null;
    listId: string | null;
    parentId: string | null;
    isRecurring: boolean;
    createdAt: string;
    updatedAt: string;
    category?: {
        id: string;
        name: string;
        color: string;
        icon: string | null;
    } | null;
    list?: {
        id: string;
        name: string;
        color: string;
    } | null;
    tags?: {
        id: string;
        name: string;
        color: string;
    }[];
    assignees?: {
        id: string;
        name: string;
        avatar?: string | null;
    }[];
    generatedFromId?: string | null;
    recurrenceRule?: RecurrenceRule | null;
    estimatedTimeMinutes?: number | null;
    subtasks?: Task[];
    _count?: {
        subtasks: number;
    };
    attachments?: Attachment[];
}
export interface CreateTaskRequest {
    title: string;
    description?: string;
    dueDate?: string;
    categoryId?: string;
    listId?: string;
    priority?: TaskPriority;
    parentId?: string;
    tagIds?: string[];
    assigneeIds?: string[];
    isRecurring?: boolean;
    recurrence?: CreateRecurrenceRequest;
}
export interface UpdateTaskRequest {
    title?: string;
    description?: string | null;
    dueDate?: string | null;
    categoryId?: string | null;
    listId?: string | null;
    priority?: TaskPriority;
    tagIds?: string[];
    assigneeIds?: string[];
}
export interface TaskFilters {
    status?: string;
    categoryId?: string;
    listId?: string;
    clientId?: string;
    tagIds?: string;
    priority?: TaskPriority;
    search?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    isRecurring?: 'true' | 'false';
    parentId?: string;
    assignedTo?: string;
    sortBy?: 'dueDate' | 'createdAt' | 'updatedAt' | 'priority' | 'order' | 'title' | 'status';
    sortDir?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    includeArchived?: 'true' | 'false';
}
export interface UpdateTaskStatusRequest {
    status: TaskStatus;
}
export interface MoveTaskRequest {
    listId?: string | null;
    categoryId?: string | null;
}
//# sourceMappingURL=task.types.d.ts.map