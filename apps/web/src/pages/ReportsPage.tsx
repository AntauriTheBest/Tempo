import { useEffect, useState, useCallback } from 'react';
import { reportsService } from '../services/reports.service';
import { PeriodSelector } from '../components/reports/PeriodSelector';
import { SummaryCards } from '../components/reports/SummaryCards';
import { TimeByClientChart } from '../components/reports/TimeByClientChart';
import { TasksByStatusChart } from '../components/reports/TasksByStatusChart';
import { CompletedOverTimeChart } from '../components/reports/CompletedOverTimeChart';
import type { ReportStats } from '@todo-list-pro/shared';

function getCurrentWeek(): number {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000
  ) + 1;
  const dayOfWeek = jan4.getDay() || 7;
  return Math.ceil((dayOfYear - dayOfWeek + 10) / 7);
}

export function ReportsPage() {
  const now = new Date();
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [week, setWeek] = useState(getCurrentWeek);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

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
    </div>
  );
}
