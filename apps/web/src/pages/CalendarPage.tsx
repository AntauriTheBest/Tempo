import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  endOfDay,
  format,
} from 'date-fns';
import { tasksService } from '../services/tasks.service';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { MonthGrid } from '../components/calendar/MonthGrid';
import { WeekGrid } from '../components/calendar/WeekGrid';
import { TaskDetail } from '../components/tasks/TaskDetail';
import { TaskForm } from '../components/tasks/TaskForm';
import { toast } from 'sonner';
import type { Task } from '@todo-list-pro/shared';

type CalendarViewMode = 'weekly' | 'monthly';

export function CalendarPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>(
    () => (localStorage.getItem('calendar-view-mode') as CalendarViewMode) || 'monthly'
  );
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [calendarTasks, setCalendarTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem('calendar-view-mode', viewMode);
  }, [viewMode]);

  const { rangeStart, rangeEnd, days } = useMemo(() => {
    if (viewMode === 'monthly') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const rStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const rEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return {
        rangeStart: rStart,
        rangeEnd: rEnd,
        days: eachDayOfInterval({ start: rStart, end: rEnd }),
      };
    } else {
      const rStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const rEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return {
        rangeStart: rStart,
        rangeEnd: rEnd,
        days: eachDayOfInterval({ start: rStart, end: rEnd }),
      };
    }
  }, [viewMode, currentDate]);

  const fetchCalendarTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await tasksService.getAll({
        dueDateFrom: rangeStart.toISOString(),
        dueDateTo: endOfDay(rangeEnd).toISOString(),
        limit: 100,
        sortBy: 'dueDate',
        sortDir: 'asc',
      });
      setCalendarTasks(result.data);
    } catch {
      toast.error('Error al cargar tareas del calendario');
    } finally {
      setIsLoading(false);
    }
  }, [rangeStart, rangeEnd]);

  useEffect(() => {
    fetchCalendarTasks();
  }, [fetchCalendarTasks]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of calendarTasks) {
      if (!task.dueDate) continue;
      const key = format(new Date(task.dueDate), 'yyyy-MM-dd');
      const arr = map.get(key) || [];
      arr.push(task);
      map.set(key, arr);
    }
    return map;
  }, [calendarTasks]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);
  const goPrev = useCallback(
    () =>
      setCurrentDate((d) =>
        viewMode === 'monthly' ? subMonths(d, 1) : subWeeks(d, 1)
      ),
    [viewMode]
  );
  const goNext = useCallback(
    () =>
      setCurrentDate((d) =>
        viewMode === 'monthly' ? addMonths(d, 1) : addWeeks(d, 1)
      ),
    [viewMode]
  );

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setPrefillDate(date.toISOString());
    setShowForm(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  }, []);

  const handleUpdate = useCallback((task: Task) => {
    setCalendarTasks((prev) =>
      prev.map((t) => (t.id === task.id ? task : t))
    );
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await tasksService.remove(id);
        setCalendarTasks((prev) => prev.filter((t) => t.id !== id));
        setShowDetail(false);
      } catch {
        toast.error('Error al eliminar tarea');
      }
    },
    []
  );

  const handleDuplicate = useCallback(
    async (id: string) => {
      try {
        const task = await tasksService.duplicate(id);
        setCalendarTasks((prev) => [...prev, task]);
      } catch {
        toast.error('Error al duplicar tarea');
      }
    },
    []
  );

  return (
    <div className="space-y-4">
      <CalendarHeader
        viewMode={viewMode}
        currentDate={currentDate}
        onViewModeChange={setViewMode}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onNewTask={() => setShowForm(true)}
      />

      {viewMode === 'monthly' ? (
        <MonthGrid
          days={days}
          currentDate={currentDate}
          tasksByDate={tasksByDate}
          isLoading={isLoading}
          onTaskClick={handleTaskClick}
          onDayClick={handleDayClick}
        />
      ) : (
        <WeekGrid
          days={days}
          tasksByDate={tasksByDate}
          isLoading={isLoading}
          onTaskClick={handleTaskClick}
          onDayClick={handleDayClick}
        />
      )}

      <TaskDetail
        task={selectedTask}
        open={showDetail}
        onOpenChange={setShowDetail}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onEdit={handleEditTask}
      />

      <TaskForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingTask(null);
            setPrefillDate(undefined);
          }
        }}
        task={editingTask}
        defaultDueDate={prefillDate}
        onSubmit={async (data) => {
          if (editingTask) {
            const updated = await tasksService.update(editingTask.id, data);
            setCalendarTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
            setEditingTask(null);
          } else {
            const created = await tasksService.create(data);
            setCalendarTasks((prev) => [...prev, created]);
          }
        }}
      />
    </div>
  );
}
