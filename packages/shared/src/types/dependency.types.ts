export interface TaskDependencyRef {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
}

export interface TaskDependencies {
  blockedBy: TaskDependencyRef[]; // tasks that must complete before this one
  blocking: TaskDependencyRef[];  // tasks that are waiting for this one
}
