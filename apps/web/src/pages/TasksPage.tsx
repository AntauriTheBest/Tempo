import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import { createListSchema } from '@todo-list-pro/shared';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Trash2, List, LayoutList, Columns3 } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useTasks } from '../hooks/useTasks';
import { useDueDateAlerts } from '../hooks/useDueDateAlerts';
import { useLists } from '../hooks/useLists';
import { useClientsStore } from '../store/clients.store';
import { useListsStore } from '../store/lists.store';
import { useTasksStore } from '../store/tasks.store';
import { tasksService } from '../services/tasks.service';
import { TaskList as TaskListComponent } from '../components/tasks/TaskList';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskDetail } from '../components/tasks/TaskDetail';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import type { Task, TaskFilters as TFilters, TaskList, TaskStatus, UpdateTaskRequest } from '@todo-list-pro/shared';
import { toast } from 'sonner';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import type { z } from 'zod';

type ListForm = z.infer<typeof createListSchema>;
type ViewMode = 'list' | 'kanban';

interface TasksPageProps {
  listFilter?: 'inbox' | 'today' | 'upcoming' | 'assigned' | 'my-tasks';
}

const PAGE_TITLES: Record<string, string> = {
  'my-tasks': 'Mis tareas',
  inbox: 'Inbox',
  today: 'Hoy',
  upcoming: 'Próximos',
  assigned: 'Asignadas a mí',
};

function DroppableListSection({
  listId,
  children,
}: {
  listId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: listId });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'space-y-2 rounded-lg p-1 transition-colors',
        isOver && 'bg-primary/5 ring-2 ring-primary/30'
      )}
    >
      {children}
    </div>
  );
}

export function TasksPage({ listFilter }: TasksPageProps) {
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

  const currentUser = useAuthStore((s) => s.user);
  const lists = useListsStore((s) => s.lists);
  const refreshCounter = useTasksStore((s) => s.refreshCounter);
  const clients = useClientsStore((s) => s.clients);
  const { createList, updateList, deleteList } = useLists();
  const [searchParams, setSearchParams] = useSearchParams();

  useDueDateAlerts(tasks);

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('tasks-view-mode') as ViewMode) || 'list'
  );
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showListsDialog, setShowListsDialog] = useState(false);
  const [showListForm, setShowListForm] = useState(false);
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const listForm = useForm<ListForm>({
    resolver: zodResolver(createListSchema),
    defaultValues: { color: '#3b82f6' },
  });

  useEffect(() => {
    localStorage.setItem('tasks-view-mode', viewMode);
  }, [viewMode]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'kanban') {
      setFilters({ status: undefined });
    }
  }, [setFilters]);

  useEffect(() => {
    if (searchParams.get('manage') === 'lists') {
      setShowListsDialog(true);
      setSearchParams({}, { replace: true });
    }
    const taskId = searchParams.get('taskId');
    if (taskId) {
      tasksService.getById(taskId).then((task) => {
        setSelectedTask(task);
        setShowDetail(true);
      }).catch(() => {});
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, setSelectedTask]);

  useEffect(() => {
    const routeFilters: Partial<TFilters> = {};
    if (listFilter === 'inbox') {
      const inboxList = lists.find((l) => l.name === 'Inbox');
      if (inboxList) routeFilters.listId = inboxList.id;
    } else if (listFilter === 'today') {
      const today = new Date();
      routeFilters.dueDateFrom = startOfDay(today).toISOString();
      routeFilters.dueDateTo = endOfDay(today).toISOString();
    } else if (listFilter === 'upcoming') {
      const today = new Date();
      routeFilters.dueDateFrom = startOfDay(today).toISOString();
      routeFilters.dueDateTo = endOfDay(addDays(today, 7)).toISOString();
    } else if (listFilter === 'assigned' && currentUser) {
      routeFilters.assignedTo = currentUser.id;
      routeFilters.status = 'PENDING,IN_PROGRESS';
    }
    if (viewMode === 'kanban') {
      routeFilters.limit = 100;
    }
    fetchTasks({ ...filters, ...routeFilters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTasks, listFilter, lists, filters, refreshCounter, viewMode]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const handleSortChange = useCallback(
    (sortBy: string, sortDir: 'asc' | 'desc') => {
      setFilters({ sortBy: sortBy as any, sortDir });
    },
    [setFilters]
  );

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const storeUpdateTask = useTasksStore((s) => s.updateTask);
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

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      try {
        const task = await tasksService.updateStatus(taskId, { status: newStatus });
        storeUpdateTask(task);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Error desconocido';
        toast.error(`Error al cambiar estado: ${msg}`);
      }
    },
    [storeUpdateTask]
  );

  const handleKanbanCreateTask = useCallback(
    async (title: string, status: TaskStatus) => {
      const newTask = await createTask({ title });
      if (newTask && status !== 'PENDING') {
        await handleStatusChange(newTask.id, status);
      }
    },
    [createTask, handleStatusChange]
  );

  const handleReorder = useCallback(
    async (items: { id: string; order: number }[]) => {
      try {
        await tasksService.reorder({ items });
      } catch {
        // Non-critical: order will be correct on next fetch
      }
    },
    []
  );

  const handleListSubmit = async (data: ListForm) => {
    if (editingList) {
      await updateList(editingList.id, data);
    } else {
      await createList(data);
    }
    setShowListForm(false);
    setEditingList(null);
    listForm.reset({ color: '#3b82f6' });
  };

  const openListForm = (list?: TaskList) => {
    if (list) {
      setEditingList(list);
      listForm.reset({
        name: list.name,
        description: list.description || undefined,
        color: list.color,
        icon: list.icon || undefined,
        clientId: list.clientId || undefined,
      });
    } else {
      setEditingList(null);
      listForm.reset({ color: '#3b82f6' });
    }
    setShowListForm(true);
  };

  const defaultListId =
    listFilter === 'inbox'
      ? lists.find((l) => l.name === 'Inbox')?.id
      : undefined;

  const userLists = lists.filter((l) => !['Inbox', 'Hoy', 'Próximos'].includes(l.name));

  // Group tasks by list
  const tasksByList = tasks.reduce((acc, task) => {
    const listId = task.listId || 'no-list';
    if (!acc[listId]) acc[listId] = [];
    acc[listId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {PAGE_TITLES[listFilter || ''] || 'Tareas'}
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 border rounded-md p-0.5">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => handleViewModeChange('list')}
              title="Vista lista"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => handleViewModeChange('kanban')}
              title="Vista tablero"
            >
              <Columns3 className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => setShowListsDialog(true)}>
            <List className="mr-1 h-4 w-4" />
            Gestionar listas
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Nueva tarea
          </Button>
        </div>
      </div>

      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClear={clearFilters}
        hideStatusFilter={viewMode === 'kanban'}
      />

      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={tasks}
          isLoading={isLoading}
          onStatusChange={handleStatusChange}
          onReorder={handleReorder}
          onTaskClick={handleTaskClick}
          onDelete={deleteTask}
          onDuplicate={duplicateTask}
          onUpdate={handleInlineUpdate}
          onCreateTask={handleKanbanCreateTask}
        />
      ) : (
        <>
          {/* Tasks grouped by list */}
          {(listFilter === 'inbox' || listFilter === 'assigned' || listFilter === 'my-tasks') && Object.keys(tasksByList).length > 1 ? (
            <div className="space-y-6">
              {Object.entries(tasksByList).map(([listId, listTasks]) => {
                const list = lists.find((l) => l.id === listId);
                const listName = list?.name || 'Sin lista';
                return (
                  <DroppableListSection key={listId} listId={listId}>
                    <div className="flex items-center gap-2 px-2">
                      {list?.color && (
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                      )}
                      <h2 className="text-lg font-semibold text-muted-foreground">
                        {listName}
                      </h2>
                      <span className="text-sm text-muted-foreground">
                        ({listTasks.length})
                      </span>
                    </div>
                    <TaskListComponent
                      tasks={listTasks}
                      isLoading={false}
                      onToggleStatus={toggleStatus}
                      onTaskClick={handleTaskClick}
                      onDelete={deleteTask}
                      onDuplicate={duplicateTask}
                      onUpdate={handleInlineUpdate}
                      onCreateTask={() => setShowForm(true)}
                      onCreateSubtask={createSubtask}
                      sortBy={filters.sortBy}
                      sortDir={filters.sortDir}
                      onSortChange={handleSortChange}
                    />
                  </DroppableListSection>
                );
              })}
            </div>
          ) : (
            <TaskListComponent
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
              onSortChange={handleSortChange}
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
            await updateTask(editingTask.id, data);
            setEditingTask(null);
          } else {
            await createTask(data);
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

      {/* Lists Management Dialog */}
      <Dialog open={showListsDialog} onOpenChange={setShowListsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar listas</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userLists.map((list) => (
              <Card key={list.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full flex-shrink-0" style={{ backgroundColor: list.color }} />
                    <div>
                      <p className="font-medium">{list.name}</p>
                      {list.client && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: list.client.color }} />
                          {list.client.name}
                        </p>
                      )}
                      {list.description && <p className="text-sm text-muted-foreground">{list.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openListForm(list)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteList(list.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {userLists.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No tienes listas personalizadas.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowListsDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={() => openListForm()}>
              <Plus className="mr-1 h-4 w-4" />
              Nueva lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List Form Dialog */}
      <Dialog open={showListForm} onOpenChange={setShowListForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingList ? 'Editar lista' : 'Nueva lista'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={listForm.handleSubmit(handleListSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">Nombre *</Label>
              <Input id="list-name" {...listForm.register('name')} />
              {listForm.formState.errors.name && (
                <p className="text-xs text-destructive">{listForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="list-description">Descripción</Label>
              <Textarea id="list-description" {...listForm.register('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="list-color">Color</Label>
              <Input id="list-color" type="color" {...listForm.register('color')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="list-client">Cliente</Label>
              <select
                id="list-client"
                {...listForm.register('clientId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sin cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowListForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={listForm.formState.isSubmitting}>
                {editingList ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
