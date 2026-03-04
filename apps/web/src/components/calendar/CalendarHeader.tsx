import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Plus } from 'lucide-react';
import { Button } from '../ui/button';

type CalendarViewMode = 'weekly' | 'monthly';

interface CalendarHeaderProps {
  viewMode: CalendarViewMode;
  currentDate: Date;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewTask: () => void;
}

export function CalendarHeader({
  viewMode,
  currentDate,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  onNewTask,
}: CalendarHeaderProps) {
  const title =
    viewMode === 'monthly'
      ? format(currentDate, 'MMMM yyyy', { locale: es })
      : `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: es })} al ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: es })}`;

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold capitalize">{title}</h1>

      <div className="flex items-center gap-2">
        <div className="flex gap-0.5 border rounded-md p-0.5">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-3" onClick={onToday}>
            Hoy
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-0.5 border rounded-md p-0.5">
          <Button
            variant={viewMode === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => onViewModeChange('monthly')}
            title="Vista mensual"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'weekly' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => onViewModeChange('weekly')}
            title="Vista semanal"
          >
            <CalendarRange className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={onNewTask}>
          <Plus className="mr-1 h-4 w-4" />
          Nueva tarea
        </Button>
      </div>
    </div>
  );
}
