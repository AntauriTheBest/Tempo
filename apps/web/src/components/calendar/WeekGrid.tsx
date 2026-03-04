import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CalendarTaskChip } from './CalendarTaskChip';
import type { Task } from '@todo-list-pro/shared';

interface WeekGridProps {
  days: Date[];
  tasksByDate: Map<string, Task[]>;
  isLoading: boolean;
  onTaskClick: (task: Task) => void;
  onDayClick: (date: Date) => void;
}

export function WeekGrid({
  days,
  tasksByDate,
  isLoading,
  onTaskClick,
  onDayClick,
}: WeekGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[400px] rounded-lg border p-2 flex flex-col"
          >
            <div className="h-12 bg-muted animate-pulse rounded mb-2" />
            <div className="flex-1 space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-16 bg-muted/50 animate-pulse rounded border" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const dayTasks = tasksByDate.get(key) || [];
        const today = isToday(day);

        return (
          <div
            key={key}
            className={cn(
              'min-h-[400px] rounded-lg border p-2 flex flex-col',
              today && 'border-primary bg-primary/5'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-center">
                <div className="text-xs text-muted-foreground uppercase">
                  {format(day, 'EEE', { locale: es })}
                </div>
                <div
                  className={cn(
                    'text-lg font-bold flex items-center justify-center w-8 h-8 rounded-full mx-auto',
                    today && 'bg-primary text-primary-foreground'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
              <button
                className="h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
                onClick={() => onDayClick(day)}
                title="Agregar tarea"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {dayTasks.map((task) => (
                <CalendarTaskChip
                  key={task.id}
                  task={task}
                  compact={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task);
                  }}
                />
              ))}
              {dayTasks.length === 0 && (
                <p className="text-xs text-muted-foreground/50 text-center py-4">
                  Sin tareas
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
