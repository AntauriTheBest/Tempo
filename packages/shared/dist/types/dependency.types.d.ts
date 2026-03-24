export interface TaskDependencyRef {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string | null;
}
export interface TaskDependencies {
    blockedBy: TaskDependencyRef[];
    blocking: TaskDependencyRef[];
}
//# sourceMappingURL=dependency.types.d.ts.map