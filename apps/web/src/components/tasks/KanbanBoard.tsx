import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { usersService, type UserSummary } from '../../services/users.service';
import type { Task, TaskStatus, UpdateTaskRequest } from '@todo-list-pro/shared';

const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'PENDING', label: 'Pendiente', color: '#94a3b8' },
  { id: 'IN_PROGRESS', label: 'En progreso', color: '#3b82f6' },
  { id: 'COMPLETED', label: 'Completada', color: '#22c55e' },
  { id: 'CANCELLED', label: 'Cancelada', color: '#ef4444' },
];

const ALL_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

interface KanbanBoardProps {
  tasks: Task[];
  isLoading: boolean;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onReorder: (items: { id: string; order: number }[]) => Promise<void>;
  onTaskClick: (task: Task) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdate: (id: string, data: UpdateTaskRequest) => Promise<any>;
  onCreateTask: (title: string, status: TaskStatus) => void;
}

type Columns = Record<TaskStatus, Task[]>;

function buildColumns(tasks: Task[]): Columns {
  const cols: Columns = {
    PENDING: [],
    IN_PROGRESS: [],
    COMPLETED: [],
    CANCELLED: [],
  };
  for (const task of tasks) {
    if (!task.parentId && cols[task.status]) {
      cols[task.status].push(task);
    }
  }
  // Sort each column by order
  for (const status of ALL_STATUSES) {
    cols[status].sort((a, b) => a.order - b.order);
  }
  return cols;
}

function findColumnForTask(taskId: string, columns: Columns): TaskStatus | null {
  for (const status of ALL_STATUSES) {
    if (columns[status].some(t => t.id === taskId)) return status;
  }
  return null;
}

export function KanbanBoard({
  tasks,
  isLoading,
  onStatusChange,
  onReorder,
  onTaskClick,
  onCreateTask,
}: KanbanBoardProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [columns, setColumns] = useState<Columns>(() => buildColumns(tasks));

  // Sync columns with tasks prop
  useEffect(() => {
    setColumns(buildColumns(tasks));
  }, [tasks]);

  // Fetch users once
  useEffect(() => {
    usersService.getAll().then(setUsers).catch(() => {});
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const taskId = event.active.id as string;
      const col = findColumnForTask(taskId, columns);
      if (col) {
        const task = columns[col].find(t => t.id === taskId);
        if (task) setActiveTask(task);
      }
    },
    [columns]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const sourceCol = findColumnForTask(activeId, columns);
      if (!sourceCol) return;

      // Determine target column
      let targetCol: TaskStatus | null = null;
      if (ALL_STATUSES.includes(overId as TaskStatus)) {
        targetCol = overId as TaskStatus;
      } else {
        targetCol = findColumnForTask(overId, columns);
      }
      if (!targetCol || sourceCol === targetCol) return;

      // Move task between columns optimistically
      setColumns(prev => {
        const sourceItems = [...prev[sourceCol]];
        const targetItems = [...prev[targetCol]];
        const taskIndex = sourceItems.findIndex(t => t.id === activeId);
        if (taskIndex === -1) return prev;

        const [movedTask] = sourceItems.splice(taskIndex, 1);

        // Find insert position
        const overIndex = targetItems.findIndex(t => t.id === overId);
        if (overIndex >= 0) {
          targetItems.splice(overIndex, 0, movedTask);
        } else {
          targetItems.push(movedTask);
        }

        return {
          ...prev,
          [sourceCol]: sourceItems,
          [targetCol]: targetItems,
        };
      });
    },
    [columns]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) {
        setColumns(buildColumns(tasks));
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      const currentCol = findColumnForTask(activeId, columns);
      if (!currentCol) return;

      // Check for reorder within same column
      if (activeId !== overId) {
        const sameCol = findColumnForTask(overId, columns);
        if (sameCol === currentCol) {
          // Reorder within column
          setColumns(prev => {
            const items = [...prev[currentCol]];
            const oldIndex = items.findIndex(t => t.id === activeId);
            const newIndex = items.findIndex(t => t.id === overId);
            if (oldIndex === -1 || newIndex === -1) return prev;
            const reordered = arrayMove(items, oldIndex, newIndex);
            return { ...prev, [currentCol]: reordered };
          });
        }
      }

      // Get the original status of the task from the tasks prop
      const originalTask = tasks.find(t => t.id === activeId);
      const originalStatus = originalTask?.status;

      // Determine if status changed by checking current column vs original
      if (originalStatus && originalStatus !== currentCol) {
        try {
          await onStatusChange(activeId, currentCol);
        } catch {
          setColumns(buildColumns(tasks));
          return;
        }
      }

      // Compute new order for affected column
      const colTasks = columns[currentCol];
      const reorderItems = colTasks.map((t, i) => ({ id: t.id, order: i }));
      if (reorderItems.length > 0) {
        try {
          await onReorder(reorderItems);
        } catch {
          // Non-critical: order will be correct on next fetch
        }
      }
    },
    [columns, tasks, onStatusChange, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    setColumns(buildColumns(tasks));
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(col => (
          <div
            key={col.id}
            className="flex flex-col w-72 min-w-[288px] flex-shrink-0 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: col.color }}
              />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="p-2 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-muted/50 animate-pulse rounded-lg border"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            tasks={columns[col.id]}
            users={users}
            onTaskClick={onTaskClick}
            onCreateTask={onCreateTask}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <KanbanCard task={activeTask} users={users} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
