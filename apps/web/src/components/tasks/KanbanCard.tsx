import { forwardRef } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraggableSyntheticListeners } from '@dnd-kit/core';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import type { Task } from '@todo-list-pro/shared';
import type { UserSummary } from '../../services/users.service';

const PRIORITY_COLORS: Record<string, string> = {
  NONE: '#94a3b8',
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

interface KanbanCardProps {
  task: Task;
  users: UserSummary[];
  isOverlay?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  attributes?: React.HTMLAttributes<HTMLDivElement>;
  listeners?: DraggableSyntheticListeners;
  isDragging?: boolean;
}

export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  function KanbanCard(
    { task, isOverlay, onClick, style, attributes, listeners, isDragging },
    ref
  ) {
    const isCompleted = task.status === 'COMPLETED';
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && !isCompleted && isPast(dueDate) && !isToday(dueDate);
    const isDueToday = dueDate && isToday(dueDate);
    const subtaskCount = task.subtasks?.length ?? 0;
    const completedSubtasks = task.subtasks?.filter(s => s.status === 'COMPLETED').length ?? 0;

    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          'rounded-lg border bg-card p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow select-none',
          isOverlay && 'shadow-lg rotate-2 opacity-90',
          isDragging && 'opacity-30',
          isCompleted && 'opacity-60'
        )}
        onClick={onClick}
        {...attributes}
        {...listeners}
      >
        {/* Row 1: Priority + Title */}
        <div className="flex items-start gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full mt-1 flex-shrink-0"
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          />
          <span
            className={cn(
              'text-sm font-medium line-clamp-2',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>
        </div>

        {/* Row 2: Metadata chips */}
        {(dueDate || task.category || (task.tags && task.tags.length > 0)) && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {dueDate && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded',
                  isOverdue
                    ? 'text-destructive bg-destructive/10'
                    : isDueToday
                      ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950'
                      : 'text-muted-foreground bg-muted'
                )}
              >
                <Calendar className="h-3 w-3" />
                {format(dueDate, 'MMM d')}
              </span>
            )}

            {task.category && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 h-4 px-1"
                style={{
                  borderColor: task.category.color,
                  color: task.category.color,
                }}
              >
                {task.category.name}
              </Badge>
            )}

            {task.tags?.slice(0, 2).map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-[10px] py-0 h-4 px-1"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
            {(task.tags?.length ?? 0) > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{task.tags!.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Row 3: Assignees + Subtask count */}
        {((task.assignees?.length ?? 0) > 0 || subtaskCount > 0) && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex -space-x-1">
              {task.assignees?.slice(0, 3).map(a => (
                <div
                  key={a.id}
                  className="h-5 w-5 rounded-full bg-primary/10 border border-background flex items-center justify-center"
                  title={a.name}
                >
                  <span className="text-[8px] font-medium text-primary">
                    {a.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
              ))}
              {(task.assignees?.length ?? 0) > 3 && (
                <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center">
                  <span className="text-[8px] font-medium text-muted-foreground">
                    +{task.assignees!.length - 3}
                  </span>
                </div>
              )}
            </div>
            {subtaskCount > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {completedSubtasks}/{subtaskCount}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

// Sortable wrapper
interface SortableKanbanCardProps {
  task: Task;
  users: UserSummary[];
  onClick: () => void;
}

export function SortableKanbanCard({ task, users, onClick }: SortableKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <KanbanCard
      ref={setNodeRef}
      task={task}
      users={users}
      onClick={onClick}
      style={style}
      attributes={attributes}
      listeners={listeners}
      isDragging={isDragging}
    />
  );
}
