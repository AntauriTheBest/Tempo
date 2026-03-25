import { useState, useEffect } from 'react';
import { ClipboardList, ArrowUp, ArrowDown } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { EmptyState } from '../common/EmptyState';
import { cn } from '../../lib/utils';
import { usersService, type UserSummary } from '../../services/users.service';
import type { Task, TaskStatus, UpdateTaskRequest } from '@todo-list-pro/shared';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onToggleStatus: (id: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdate: (id: string, data: UpdateTaskRequest) => Promise<any>;
  onCreateTask?: () => void;
  onCreateSubtask?: (parentId: string, title: string) => Promise<any>;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortDir: 'asc' | 'desc') => void;
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  field: string;
  currentSort?: string;
  currentDir?: 'asc' | 'desc';
  onSort?: (field: string, dir: 'asc' | 'desc') => void;
}) {
  if (!onSort) return <div>{label}</div>;

  const isActive = currentSort === field;
  return (
    <button
      className={cn(
        'flex items-center gap-1 hover:text-foreground transition-colors',
        isActive && 'text-foreground'
      )}
      onClick={() =>
        onSort(field, isActive && currentDir === 'asc' ? 'desc' : 'asc')
      }
    >
      {label}
      {isActive &&
        (currentDir === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        ))}
    </button>
  );
}

export function TaskList({
  tasks,
  isLoading,
  onToggleStatus,
  onTaskClick,
  onDelete,
  onDuplicate,
  onUpdate,
  onCreateTask,
  onCreateSubtask,
  sortBy,
  sortDir,
  onSortChange,
}: TaskListProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);

  useEffect(() => {
    usersService.getAll().then(setUsers).catch(() => {});
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg border bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No hay tareas"
        description="Crea tu primera tarea para comenzar a organizar tu trabajo."
        actionLabel={onCreateTask ? 'Crear tarea' : undefined}
        onAction={onCreateTask}
      />
    );
  }

  return (
    <div className="rounded-lg border">
      {/* Column Headers */}
      <div className="grid grid-cols-[auto_auto_auto_auto_1fr_100px_100px_100px_120px_100px_80px_auto] items-center gap-2 px-3 py-2 bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="w-4" />
        <div className="w-5" />
        <div className="w-5" />
        <div className="w-5" />
        <SortableHeader
          label="Tarea"
          field="title"
          currentSort={sortBy}
          currentDir={sortDir}
          onSort={onSortChange}
        />
        <SortableHeader
          label="Prioridad"
          field="priority"
          currentSort={sortBy}
          currentDir={sortDir}
          onSort={onSortChange}
        />
        <SortableHeader
          label="Inicio"
          field="startDate"
          currentSort={sortBy}
          currentDir={sortDir}
          onSort={onSortChange}
        />
        <SortableHeader
          label="Vence"
          field="dueDate"
          currentSort={sortBy}
          currentDir={sortDir}
          onSort={onSortChange}
        />
        <div>Categoría</div>
        <div>Etiquetas</div>
        <div>Asignados</div>
        <div className="w-7" />
      </div>

      {/* Task Rows */}
      <div className="divide-y">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            users={users}
            onToggleStatus={onToggleStatus}
            onClick={onTaskClick}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onUpdate={onUpdate}
            onCreateSubtask={onCreateSubtask}
          />
        ))}
      </div>
    </div>
  );
}
