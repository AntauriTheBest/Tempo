import { z } from 'zod';
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    listId: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    parentId: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    assigneeIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isRecurring: z.ZodOptional<z.ZodBoolean>;
    recurrence: z.ZodOptional<z.ZodObject<{
        frequency: z.ZodEnum<["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]>;
        interval: z.ZodDefault<z.ZodNumber>;
        dayOfMonth: z.ZodOptional<z.ZodNumber>;
        startDate: z.ZodString;
        endDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
        interval: number;
        startDate: string;
        dayOfMonth?: number | undefined;
        endDate?: string | undefined;
    }, {
        frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
        startDate: string;
        interval?: number | undefined;
        dayOfMonth?: number | undefined;
        endDate?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    title: string;
    dueDate?: string | undefined;
    description?: string | undefined;
    categoryId?: string | undefined;
    listId?: string | undefined;
    parentId?: string | undefined;
    tagIds?: string[] | undefined;
    assigneeIds?: string[] | undefined;
    isRecurring?: boolean | undefined;
    recurrence?: {
        frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
        interval: number;
        startDate: string;
        dayOfMonth?: number | undefined;
        endDate?: string | undefined;
    } | undefined;
}, {
    title: string;
    dueDate?: string | undefined;
    priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    description?: string | undefined;
    categoryId?: string | undefined;
    listId?: string | undefined;
    parentId?: string | undefined;
    tagIds?: string[] | undefined;
    assigneeIds?: string[] | undefined;
    isRecurring?: boolean | undefined;
    recurrence?: {
        frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
        startDate: string;
        interval?: number | undefined;
        dayOfMonth?: number | undefined;
        endDate?: string | undefined;
    } | undefined;
}>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    listId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    priority: z.ZodOptional<z.ZodEnum<["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    assigneeIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    dueDate?: string | null | undefined;
    priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    title?: string | undefined;
    description?: string | null | undefined;
    categoryId?: string | null | undefined;
    listId?: string | null | undefined;
    tagIds?: string[] | undefined;
    assigneeIds?: string[] | undefined;
}, {
    dueDate?: string | null | undefined;
    priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    title?: string | undefined;
    description?: string | null | undefined;
    categoryId?: string | null | undefined;
    listId?: string | null | undefined;
    tagIds?: string[] | undefined;
    assigneeIds?: string[] | undefined;
}>;
export declare const taskFiltersSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    listId: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    search: z.ZodOptional<z.ZodString>;
    dueDateFrom: z.ZodOptional<z.ZodString>;
    dueDateTo: z.ZodOptional<z.ZodString>;
    isRecurring: z.ZodOptional<z.ZodEnum<["true", "false"]>>;
    parentId: z.ZodOptional<z.ZodString>;
    assignedTo: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["dueDate", "createdAt", "updatedAt", "priority", "order", "title", "status"]>>;
    sortDir: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    includeArchived: z.ZodOptional<z.ZodEnum<["true", "false"]>>;
}, "strip", z.ZodTypeAny, {
    sortBy: "dueDate" | "createdAt" | "updatedAt" | "priority" | "order" | "title" | "status";
    sortDir: "asc" | "desc";
    page: number;
    limit: number;
    priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    status?: string | undefined;
    clientId?: string | undefined;
    categoryId?: string | undefined;
    listId?: string | undefined;
    parentId?: string | undefined;
    tagIds?: string | undefined;
    isRecurring?: "true" | "false" | undefined;
    search?: string | undefined;
    dueDateFrom?: string | undefined;
    dueDateTo?: string | undefined;
    assignedTo?: string | undefined;
    includeArchived?: "true" | "false" | undefined;
}, {
    priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    status?: string | undefined;
    clientId?: string | undefined;
    categoryId?: string | undefined;
    listId?: string | undefined;
    parentId?: string | undefined;
    tagIds?: string | undefined;
    isRecurring?: "true" | "false" | undefined;
    search?: string | undefined;
    dueDateFrom?: string | undefined;
    dueDateTo?: string | undefined;
    assignedTo?: string | undefined;
    sortBy?: "dueDate" | "createdAt" | "updatedAt" | "priority" | "order" | "title" | "status" | undefined;
    sortDir?: "asc" | "desc" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    includeArchived?: "true" | "false" | undefined;
}>;
export declare const updateTaskStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]>;
}, "strip", z.ZodTypeAny, {
    status: "CANCELLED" | "PENDING" | "IN_PROGRESS" | "COMPLETED";
}, {
    status: "CANCELLED" | "PENDING" | "IN_PROGRESS" | "COMPLETED";
}>;
export declare const moveTaskSchema: z.ZodObject<{
    listId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    categoryId?: string | null | undefined;
    listId?: string | null | undefined;
}, {
    categoryId?: string | null | undefined;
    listId?: string | null | undefined;
}>;
//# sourceMappingURL=task.validators.d.ts.map