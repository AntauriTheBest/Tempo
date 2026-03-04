import { create } from 'zustand';
import type { Task, TaskFilters } from '@todo-list-pro/shared';

interface TasksState {
  tasks: Task[];
  selectedTask: Task | null;
  filters: TaskFilters;
  isLoading: boolean;
  meta: { total: number; page: number; limit: number; totalPages: number };
  refreshCounter: number;
  setTasks: (tasks: Task[], meta: TasksState['meta']) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (id: string) => void;
  requestRefresh: () => void;
}

const defaultFilters: TaskFilters = {
  sortBy: 'order',
  sortDir: 'asc',
  page: 1,
  limit: 20,
};

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  selectedTask: null,
  filters: defaultFilters,
  isLoading: false,
  meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  refreshCounter: 0,

  setTasks: (tasks, meta) => set({ tasks, meta }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
    })),
  clearFilters: () => set({ filters: defaultFilters }),
  setLoading: (isLoading) => set({ isLoading }),
  addTask: (task) =>
    set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (task) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
      selectedTask:
        state.selectedTask?.id === task.id ? task : state.selectedTask,
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
    })),
  requestRefresh: () =>
    set((state) => ({ refreshCounter: state.refreshCounter + 1 })),
}));
