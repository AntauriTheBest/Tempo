import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import type { Task } from '@todo-list-pro/shared';

const PRIORITY_COLORS: Record<string, string> = {
  NONE: '#94a3b8',
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

interface CalendarTaskChipProps {
  task: Task;
  compact: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function CalendarTaskChip({ task, compact, onClick }: CalendarTaskChipProps) {
  const isCompleted = task.status === 'COMPLETED';

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] cursor-pointer truncate',
          'hover:bg-accent transition-colors',
          isCompleted && 'opacity-50 line-through'
        )}
        onClick={onClick}
      >
        <span
          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        />
        <span className="truncate">{task.title}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-1.5 px-2 py-1.5 rounded border cursor-pointer',
        'hover:shadow-sm transition-all bg-card',
        isCompleted && 'opacity-50'
      )}
      onClick={onClick}
    >
      <span
        className="h-2 w-2 rounded-full flex-shrink-0 mt-1"
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-xs font-medium truncate',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </p>
        {task.dueDate && (
          <p className="text-[10px] text-muted-foreground">
            {format(new Date(task.dueDate), 'HH:mm')}
          </p>
        )}
        {task.category && (
          <Badge
            variant="outline"
            className="text-[9px] py-0 h-3.5 px-1 mt-0.5"
            style={{ borderColor: task.category.color, color: task.category.color }}
          >
            {task.category.name}
          </Badge>
        )}
      </div>
    </div>
  );
}
