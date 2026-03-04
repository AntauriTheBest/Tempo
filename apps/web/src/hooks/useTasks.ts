import { useCallback } from 'react';
import { useTasksStore } from '../store/tasks.store';
import { tasksService } from '../services/tasks.service';
import type {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  TaskStatus,
} from '@todo-list-pro/shared';
import { toast } from 'sonner';

export function useTasks() {
  const tasks = useTasksStore((s) => s.tasks);
  const selectedTask = useTasksStore((s) => s.selectedTask);
  const filters = useTasksStore((s) => s.filters);
  const isLoading = useTasksStore((s) => s.isLoading);
  const meta = useTasksStore((s) => s.meta);
  const setTasks = useTasksStore((s) => s.setTasks);
  const setSelectedTask = useTasksStore((s) => s.setSelectedTask);
  const setFilters = useTasksStore((s) => s.setFilters);
  const clearFilters = useTasksStore((s) => s.clearFilters);
  const setLoading = useTasksStore((s) => s.setLoading);
  const addTask = useTasksStore((s) => s.addTask);
  const storeUpdateTask = useTasksStore((s) => s.updateTask);
  const removeTask = useTasksStore((s) => s.removeTask);
  const requestRefresh = useTasksStore((s) => s.requestRefresh);

  const fetchTasks = useCallback(
    async (allFilters: Partial<TaskFilters> = {}) => {
      setLoading(true);
      try {
        const result = await tasksService.getAll(allFilters);
        setTasks(result.data, result.meta);
      } catch {
        toast.error('Error loading tasks');
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setTasks]
  );

  const createTask = useCallback(
    async (data: CreateTaskRequest) => {
      try {
        const task = await tasksService.create(data);
        addTask(task);
        toast.success('Task created');
        return task;
      } catch {
        toast.error('Error creating task');
      }
    },
    [addTask]
  );

  const updateTask = useCallback(
    async (id: string, data: UpdateTaskRequest) => {
      try {
        const task = await tasksService.update(id, data);
        storeUpdateTask(task);
        toast.success('Task updated');
        return task;
      } catch {
        toast.error('Error updating task');
      }
    },
    [storeUpdateTask]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await tasksService.remove(id);
        removeTask(id);
        toast.success('Task deleted');
      } catch {
        toast.error('Error deleting task');
      }
    },
    [removeTask]
  );

  const toggleStatus = useCallback(
    async (id: string, currentStatus: TaskStatus) => {
      const newStatus: TaskStatus =
        currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      try {
        const task = await tasksService.updateStatus(id, {
          status: newStatus,
        });
        storeUpdateTask(task);
      } catch {
        toast.error('Error updating status');
      }
    },
    [storeUpdateTask]
  );

  const createSubtask = useCallback(
    async (parentId: string, title: string) => {
      try {
        await tasksService.createSubtask(parentId, { title });
        requestRefresh();
        toast.success('Subtarea creada');
      } catch {
        toast.error('Error al crear subtarea');
      }
    },
    [requestRefresh]
  );

  const duplicateTask = useCallback(
    async (id: string) => {
      try {
        const task = await tasksService.duplicate(id);
        addTask(task);
        toast.success('Task duplicated');
        return task;
      } catch {
        toast.error('Error duplicating task');
      }
    },
    [addTask]
  );

  return {
    tasks,
    selectedTask,
    setSelectedTask,
    filters,
    setFilters,
    clearFilters,
    isLoading,
    meta,
    fetchTasks,
    createTask,
    createSubtask,
    updateTask,
    deleteTask,
    toggleStatus,
    duplicateTask,
  };
}
