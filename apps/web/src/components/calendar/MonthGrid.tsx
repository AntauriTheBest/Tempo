import { format, isSameMonth, isToday } from 'date-fns';
import { cn } from '../../lib/utils';
import { CalendarTaskChip } from './CalendarTaskChip';
import type { Task } from '@todo-list-pro/shared';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface MonthGridProps {
  days: Date[];
  currentDate: Date;
  tasksByDate: Map<string, Task[]>;
  isLoading: boolean;
  onTaskClick: (task: Task) => void;
  onDayClick: (date: Date) => void;
}

export function MonthGrid({
  days,
  currentDate,
  tasksByDate,
  isLoading,
  onTaskClick,
  onDayClick,
}: MonthGridProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground text-center border-b bg-muted/30"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[100px] border-b border-r p-2">
              <div className="h-4 w-4 bg-muted animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-1.5 text-xs font-medium text-muted-foreground text-center border-b bg-muted/30"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(key) || [];
          const inCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={key}
              className={cn(
                'min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-accent/30 transition-colors',
                !inCurrentMonth && 'bg-muted/30',
                today && 'bg-primary/5'
              )}
              onClick={() => onDayClick(day)}
            >
              <div className="flex justify-end mb-0.5">
                <span
                  className={cn(
                    'text-xs font-medium flex items-center justify-center w-6 h-6 rounded-full',
                    today && 'bg-primary text-primary-foreground',
                    !inCurrentMonth && !today && 'text-muted-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => (
                  <CalendarTaskChip
                    key={task.id}
                    task={task}
                    compact
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                  />
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1">
                    +{dayTasks.length - 3} más
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
