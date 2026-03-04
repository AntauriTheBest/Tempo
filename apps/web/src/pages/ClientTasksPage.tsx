import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Building2 } from 'lucide-react';
import { useListsStore } from '../store/lists.store';
import { tasksService } from '../services/tasks.service';
import { clientsService } from '../services/clients.service';
import { TaskList } from '../components/tasks/TaskList';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskDetail } from '../components/tasks/TaskDetail';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import type { Task, Client, TaskFilters as TFilters, UpdateTaskRequest } from '@todo-list-pro/shared';

const defaultFilters: TFilters = {
  sortBy: 'order',
  sortDir: 'asc',
  page: 1,
  limit: 50,
};

export function ClientTasksPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFiltersState] = useState<TFilters>(defaultFilters);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const lists = useListsStore((s) => s.lists);

  // Fetch client info
  useEffect(() => {
    if (id) {
      clientsService.getById(id).then(setClient).catch(() => {});
    }
  }, [id]);

  // Fetch tasks filtered by client's lists
  const fetchTasks = useCallback(async () => {
    if (!id) return;

    const clientListIds = lists.filter((l) => l.clientId === id).map((l) => l.id);

    if (clientListIds.length === 0) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch tasks for each of the client's lists
      const results = await Promise.all(
        clientListIds.map((listId) =>
          tasksService.getAll({ ...filters, listId })
        )
      );
      const allTasks = results.flatMap((r) => r.data);
      setTasks(allTasks);
    } catch {
      toast.error('Error al cargar tareas');
    } finally {
      setIsLoading(false);
    }
  }, [id, lists, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const setFilters = (newFilters: Partial<TFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const clearFilters = () => {
    setFiltersState(defaultFilters);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleInlineUpdate = useCallback(
    async (taskId: string, data: UpdateTaskRequest) => {
      try {
        const updated = await tasksService.update(taskId, data);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } catch {
        toast.error('Error al actualizar');
      }
    },
    []
  );

  const handleToggleStatus = useCallback(
    async (taskId: string, currentStatus: string) => {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      try {
        const updated = await tasksService.updateStatus(taskId, { status: newStatus as any });
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } catch {
        toast.error('Error al actualizar estado');
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (taskId: string) => {
      try {
        await tasksService.remove(taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        toast.success('Tarea eliminada');
      } catch {
        toast.error('Error al eliminar');
      }
    },
    []
  );

  const handleDuplicate = useCallback(
    async (taskId: string) => {
      try {
        const dup = await tasksService.duplicate(taskId);
        setTasks((prev) => [dup, ...prev]);
        toast.success('Tarea duplicada');
      } catch {
        toast.error('Error al duplicar');
      }
    },
    []
  );

  const handleCreateSubtask = useCallback(
    async (parentId: string, title: string) => {
      try {
        await tasksService.createSubtask(parentId, { title });
        fetchTasks();
        toast.success('Subtarea creada');
      } catch {
        toast.error('Error al crear subtarea');
      }
    },
    [fetchTasks]
  );

  // Group tasks by list
  const tasksByList = tasks.reduce((acc, task) => {
    const listId = task.listId || 'no-list';
    if (!acc[listId]) acc[listId] = [];
    acc[listId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const clientLists = lists.filter((l) => l.clientId === id);
  const defaultListId = clientLists.length === 1 ? clientLists[0].id : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {client?.color ? (
            <span
              className="h-5 w-5 rounded-full"
              style={{ backgroundColor: client.color }}
            />
          ) : (
            <Building2 className="h-5 w-5 text-muted-foreground" />
          )}
          <h1 className="text-2xl font-bold">{client?.name || 'Cliente'}</h1>
          {clientLists.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({tasks.length} tareas en {clientLists.length} {clientLists.length === 1 ? 'lista' : 'listas'})
            </span>
          )}
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Nueva tarea
        </Button>
      </div>

      {client?.contactName && (
        <p className="text-sm text-muted-foreground">
          Contacto: {client.contactName}
          {client.contactEmail && ` — ${client.contactEmail}`}
        </p>
      )}

      {clientLists.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground py-8">
          Este cliente no tiene listas asignadas.
        </p>
      )}

      {clientLists.length > 0 && (
        <>
          <TaskFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={clearFilters}
          />

          {Object.keys(tasksByList).length > 1 ? (
            <div className="space-y-6">
              {Object.entries(tasksByList).map(([listId, listTasks]) => {
                const list = lists.find((l) => l.id === listId);
                return (
                  <div key={listId} className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      {list?.color && (
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                      )}
                      <h2 className="text-lg font-semibold text-muted-foreground">
                        {list?.name || 'Sin lista'}
                      </h2>
                      <span className="text-sm text-muted-foreground">
                        ({listTasks.length})
                      </span>
                    </div>
                    <TaskList
                      tasks={listTasks}
                      isLoading={false}
                      onToggleStatus={handleToggleStatus}
                      onTaskClick={handleTaskClick}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onUpdate={handleInlineUpdate}
                      onCreateTask={() => setShowForm(true)}
                      onCreateSubtask={handleCreateSubtask}
                      sortBy={filters.sortBy}
                      sortDir={filters.sortDir}
                      onSortChange={(sortBy, sortDir) => setFilters({ sortBy: sortBy as any, sortDir })}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              isLoading={isLoading}
              onToggleStatus={handleToggleStatus}
              onTaskClick={handleTaskClick}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onUpdate={handleInlineUpdate}
              onCreateTask={() => setShowForm(true)}
              onCreateSubtask={handleCreateSubtask}
              sortBy={filters.sortBy}
              sortDir={filters.sortDir}
              onSortChange={(sortBy, sortDir) => setFilters({ sortBy: sortBy as any, sortDir })}
            />
          )}
        </>
      )}

      <TaskForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        defaultListId={defaultListId}
        onSubmit={async (data) => {
          if (editingTask) {
            const updated = await tasksService.update(editingTask.id, data);
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setEditingTask(null);
          } else {
            const created = await tasksService.create(data);
            setTasks((prev) => [created, ...prev]);
          }
        }}
      />

      <TaskDetail
        task={selectedTask}
        open={showDetail}
        onOpenChange={setShowDetail}
        onUpdate={(task) => setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onEdit={handleEditTask}
      />
    </div>
  );
}
