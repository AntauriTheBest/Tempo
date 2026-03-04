import { z } from 'zod';
import { createRecurrenceSchema } from './recurrence.validators';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  dueDate: z.string().datetime().optional(),
  categoryId: z.string().cuid().optional(),
  listId: z.string().cuid().optional(),
  priority: z
    .enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .default('NONE'),
  parentId: z.string().cuid().optional(),
  tagIds: z.array(z.string().cuid()).max(10).optional(),
  assigneeIds: z.array(z.string().cuid()).optional(),
  isRecurring: z.boolean().optional(),
  recurrence: createRecurrenceSchema.optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  categoryId: z.string().cuid().nullable().optional(),
  listId: z.string().cuid().nullable().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  tagIds: z.array(z.string().cuid()).max(10).optional(),
  assigneeIds: z.array(z.string().cuid()).optional(),
});

export const taskFiltersSchema = z.object({
  status: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  listId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  tagIds: z.string().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  search: z.string().max(200).optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  isRecurring: z.enum(['true', 'false']).optional(),
  parentId: z.string().optional(),
  assignedTo: z.string().optional(),
  sortBy: z
    .enum(['dueDate', 'createdAt', 'priority', 'order', 'title', 'status'])
    .default('order'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

export const moveTaskSchema = z.object({
  listId: z.string().cuid().nullable().optional(),
  categoryId: z.string().cuid().nullable().optional(),
});
