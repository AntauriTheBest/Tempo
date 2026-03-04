import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useTasksStore } from '../store/tasks.store';
import { tasksService } from '../services/tasks.service';
import { listsService } from '../services/lists.service';
import { TaskList } from '../components/tasks/TaskList';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskDetail } from '../components/tasks/TaskDetail';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import type { Task, TaskList as TList, UpdateTaskRequest } from '@todo-list-pro/shared';

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<TList | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const {
    tasks,
    isLoading,
    filters,
    setFilters,
    clearFilters,
    fetchTasks,
    createTask,
    createSubtask,
    updateTask,
    deleteTask,
    toggleStatus,
    duplicateTask,
    setSelectedTask,
    selectedTask,
  } = useTasks();

  const storeUpdateTask = useTasksStore((s) => s.updateTask);
  const refreshCounter = useTasksStore((s) => s.refreshCounter);

  useEffect(() => {
    if (id) {
      listsService.getById(id).then(setList).catch(() => {});
      fetchTasks({ ...filters, listId: id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fetchTasks, filters, refreshCounter]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };
  const handleInlineUpdate = useCallback(
    async (id: string, data: UpdateTaskRequest) => {
      try {
        const task = await tasksService.update(id, data);
        storeUpdateTask(task);
      } catch {
        toast.error('Error al actualizar');
      }
    },
    [storeUpdateTask]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {list?.color && (
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: list.color }}
            />
          )}
          <h1 className="text-2xl font-bold">{list?.name || 'Lista'}</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Nueva tarea
        </Button>
      </div>

      {list?.client && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: list.client.color }} />
          {list.client.name}
        </p>
      )}

      {list?.description && (
        <p className="text-sm text-muted-foreground">{list.description}</p>
      )}

      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClear={clearFilters}
      />

      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        onToggleStatus={toggleStatus}
        onTaskClick={handleTaskClick}
        onDelete={deleteTask}
        onDuplicate={duplicateTask}
        onUpdate={handleInlineUpdate}
        onCreateTask={() => setShowForm(true)}
        onCreateSubtask={createSubtask}
        sortBy={filters.sortBy}
        sortDir={filters.sortDir}
        onSortChange={(sortBy, sortDir) => setFilters({ sortBy: sortBy as any, sortDir })}
      />

      <TaskForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        defaultListId={id}
        onSubmit={async (data) => {
          if (editingTask) {
            await updateTask(editingTask.id, data);
            setEditingTask(null);
          } else {
            await createTask({ ...data, listId: id });
          }
        }}
      />

      <TaskDetail
        task={selectedTask}
        open={showDetail}
        onOpenChange={setShowDetail}
        onUpdate={storeUpdateTask}
        onDelete={deleteTask}
        onDuplicate={duplicateTask}
        onEdit={handleEditTask}
      />
    </div>
  );
}
