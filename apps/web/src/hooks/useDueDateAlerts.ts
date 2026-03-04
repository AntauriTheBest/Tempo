import { useEffect, useState } from 'react';
import { isPast, isToday, addDays } from 'date-fns';
import { toast } from 'sonner';
import type { Task } from '@todo-list-pro/shared';

export function useDueDateAlerts(tasks: Task[]) {
  const [alerted, setAlerted] = useState(false);

  useEffect(() => {
    if (alerted || tasks.length === 0) return;

    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);

    const overdue: Task[] = [];
    const dueSoon: Task[] = [];

    for (const task of tasks) {
      if (!task.dueDate || task.status === 'COMPLETED' || task.status === 'CANCELLED') continue;
      const due = new Date(task.dueDate);
      if (isPast(due) && !isToday(due)) {
        overdue.push(task);
      } else if (due <= threeDaysFromNow) {
        dueSoon.push(task);
      }
    }

    if (overdue.length > 0) {
      toast.error(`${overdue.length} tarea(s) vencida(s)`, {
        description:
          overdue.slice(0, 3).map((t) => t.title).join(', ') +
          (overdue.length > 3 ? '...' : ''),
        duration: 8000,
      });
    }

    if (dueSoon.length > 0) {
      toast.warning(`${dueSoon.length} tarea(s) por vencer en los próximos 3 días`, {
        description:
          dueSoon.slice(0, 3).map((t) => t.title).join(', ') +
          (dueSoon.length > 3 ? '...' : ''),
        duration: 6000,
      });
    }

    setAlerted(true);
  }, [tasks, alerted]);
}
