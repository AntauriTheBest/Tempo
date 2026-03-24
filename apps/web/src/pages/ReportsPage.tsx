import { useEffect, useState, useCallback } from 'react';
import { reportsService } from '../services/reports.service';
import { PeriodSelector } from '../components/reports/PeriodSelector';
import { SummaryCards } from '../components/reports/SummaryCards';
import { TimeByClientChart } from '../components/reports/TimeByClientChart';
import { TasksByStatusChart } from '../components/reports/TasksByStatusChart';
import { CompletedOverTimeChart } from '../components/reports/CompletedOverTimeChart';
import { apiClient } from '../services/api-client';
import { ChevronDown, ChevronRight, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ReportStats, Task } from '@todo-list-pro/shared';

function getCurrentWeek(): number {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000
  ) + 1;
  const dayOfWeek = jan4.getDay() || 7;
  return Math.ceil((dayOfYear - dayOfWeek + 10) / 7);
}

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'text-green-600',
  CANCELLED: 'text-red-500',
};

export function ReportsPage() {
  const now = new Date();
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [week, setWeek] = useState(getCurrentWeek);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedPage, setArchivedPage] = useState(1);
  const [archivedTotal, setArchivedTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reportsService.getMyStats({
        period,
        year,
        month: period === 'monthly' ? month : undefined,
        week: period === 'weekly' ? week : undefined,
      });
      setStats(result);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  }, [period, year, month, week]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchArchived = useCallback(async (page: number) => {
    setArchivedLoading(true);
    try {
      const res = await apiClient.get('/tasks', {
        params: { includeArchived: 'true', status: 'COMPLETED,CANCELLED', sortBy: 'updatedAt', sortDir: 'desc', page, limit: 20 },
      });
      const data = res.data;
      if (page === 1) {
        setArchivedTasks(data.data ?? []);
      } else {
        setArchivedTasks((prev) => [...prev, ...(data.data ?? [])]);
      }
      setArchivedTotal(data.total ?? 0);
      setArchivedPage(page);
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  const handleToggleArchived = () => {
    if (!showArchived && archivedTasks.length === 0) {
      fetchArchived(1);
    }
    setShowArchived((v) => !v);
  };

  const handlePeriodChange = (updates: {
    period?: 'weekly' | 'monthly';
    year?: number;
    month?: number;
    week?: number;
  }) => {
    if (updates.period !== undefined) setPeriod(updates.period);
    if (updates.year !== undefined) setYear(updates.year);
    if (updates.month !== undefined) setMonth(updates.month);
    if (updates.week !== undefined) setWeek(updates.week);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Mis reportes</h2>

      <PeriodSelector
        period={period}
        year={year}
        month={month}
        week={week}
        onChange={handlePeriodChange}
      />

      {stats && (
        <>
          <SummaryCards summary={stats.summary} />

          <div className="grid gap-6 lg:grid-cols-2">
            <TimeByClientChart data={stats.timeByClient} />
            <TasksByStatusChart data={stats.tasksByStatus} />
          </div>

          <CompletedOverTimeChart data={stats.completedOverTime} />
        </>
      )}

      {/* Archived tasks section */}
      <div className="rounded-lg border bg-card">
        <button
          onClick={handleToggleArchived}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors rounded-lg"
        >
          {showArchived ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Archive className="h-4 w-4 text-muted-foreground" />
          <span>Tareas archivadas</span>
          <span className="text-xs text-muted-foreground ml-1">(completadas/canceladas hace más de 30 días)</span>
          {archivedTotal > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{archivedTotal} tareas</span>
          )}
        </button>

        {showArchived && (
          <div className="border-t px-4 pb-4">
            {archivedLoading && archivedTasks.length === 0 ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : archivedTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No hay tareas archivadas.</p>
            ) : (
              <>
                <div className="divide-y">
                  {archivedTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className={`font-medium ${STATUS_COLORS[task.status] ?? ''}`}>
                        {STATUS_LABELS[task.status] ?? task.status}
                      </span>
                      <span className="flex-1 truncate text-muted-foreground">{task.title}</span>
                      {task.list && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.list.color }} />
                          {task.list.name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {format(new Date(task.updatedAt), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  ))}
                </div>
                {archivedTasks.length < archivedTotal && (
                  <button
                    onClick={() => fetchArchived(archivedPage + 1)}
                    disabled={archivedLoading}
                    className="mt-3 w-full rounded-md border py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {archivedLoading ? 'Cargando...' : 'Cargar más'}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
