"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveTaskSchema = exports.updateTaskStatusSchema = exports.taskFiltersSchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
const recurrence_validators_1 = require("./recurrence.validators");
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(500),
    description: zod_1.z.string().max(5000).optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    categoryId: zod_1.z.string().cuid().optional(),
    listId: zod_1.z.string().cuid().optional(),
    priority: zod_1.z
        .enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'])
        .default('NONE'),
    parentId: zod_1.z.string().cuid().optional(),
    tagIds: zod_1.z.array(zod_1.z.string().cuid()).max(10).optional(),
    assigneeIds: zod_1.z.array(zod_1.z.string().cuid()).optional(),
    isRecurring: zod_1.z.boolean().optional(),
    recurrence: recurrence_validators_1.createRecurrenceSchema.optional(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(500).optional(),
    description: zod_1.z.string().max(5000).nullable().optional(),
    dueDate: zod_1.z.string().datetime().nullable().optional(),
    categoryId: zod_1.z.string().cuid().nullable().optional(),
    listId: zod_1.z.string().cuid().nullable().optional(),
    priority: zod_1.z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    tagIds: zod_1.z.array(zod_1.z.string().cuid()).max(10).optional(),
    assigneeIds: zod_1.z.array(zod_1.z.string().cuid()).optional(),
});
exports.taskFiltersSchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().cuid().optional(),
    listId: zod_1.z.string().cuid().optional(),
    clientId: zod_1.z.string().cuid().optional(),
    tagIds: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    search: zod_1.z.string().max(200).optional(),
    dueDateFrom: zod_1.z.string().datetime().optional(),
    dueDateTo: zod_1.z.string().datetime().optional(),
    isRecurring: zod_1.z.enum(['true', 'false']).optional(),
    parentId: zod_1.z.string().optional(),
    assignedTo: zod_1.z.string().optional(),
    sortBy: zod_1.z
        .enum(['dueDate', 'createdAt', 'updatedAt', 'priority', 'order', 'title', 'status'])
        .default('order'),
    sortDir: zod_1.z.enum(['asc', 'desc']).default('asc'),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    includeArchived: zod_1.z.enum(['true', 'false']).optional(),
});
exports.updateTaskStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});
exports.moveTaskSchema = zod_1.z.object({
    listId: zod_1.z.string().cuid().nullable().optional(),
    categoryId: zod_1.z.string().cuid().nullable().optional(),
});
//# sourceMappingURL=task.validators.js.map