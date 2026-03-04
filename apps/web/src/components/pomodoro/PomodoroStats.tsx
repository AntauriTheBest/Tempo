import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Target, Trash2, Timer, Clock4 } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { timeTrackingService } from '../../services/time-tracking.service';
import type { TimeEntry, TaskTimeStats } from '@todo-list-pro/shared';
import { toast } from 'sonner';
import { usePomodoroStore } from '../../store/pomodoro.store';

interface PomodoroStatsProps {
  taskId: string;
  expanded?: boolean;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function PomodoroStats({ taskId, expanded = false }: PomodoroStatsProps) {
  const [stats, setStats] = useState<TaskTimeStats | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [editingEstimate, setEditingEstimate] = useState(false);
  const [estimateValue, setEstimateValue] = useState('');
  const [showEntries, setShowEntries] = useState(expanded);

  // Re-fetch when a timer stops (phase goes idle)
  const phase = usePomodoroStore((s) => s.phase);

  const fetchData = useCallback(() => {
    timeTrackingService
      .getByTask(taskId)
      .then((res) => {
        setStats(res.stats);
        setEntries(res.entries);
      })
      .catch(() => {});
  }, [taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, phase]);

  const handleSaveEstimate = async () => {
    const parsed = estimateValue.trim() === '' ? null : parseInt(estimateValue, 10);
    if (parsed !== null && (isNaN(parsed) || parsed < 0)) {
      toast.error('Valor inválido');
      return;
    }
    try {
      await timeTrackingService.updateEstimate(taskId, parsed);
      setStats((prev) =>
        prev ? { ...prev, estimatedTimeMinutes: parsed } : prev
      );
      setEditingEstimate(false);
    } catch {
      toast.error('Error al actualizar estimación');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await timeTrackingService.remove(entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      // Recalculate stats
      const remaining = entries.filter((e) => e.id !== entryId);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              totalMinutes: remaining.reduce((s, e) => s + e.durationMinutes, 0),
              pomodoroSessions: remaining.filter((e) => e.type === 'POMODORO').length,
            }
          : prev
      );
      toast.success('Registro eliminado');
    } catch {
      toast.error('Error al eliminar registro');
    }
  };

  if (!stats) return null;

  const percentage =
    stats.estimatedTimeMinutes && stats.estimatedTimeMinutes > 0
      ? Math.min(
          Math.round((stats.totalMinutes / stats.estimatedTimeMinutes) * 100),
          100
        )
      : null;

  const manualSessions = entries.filter((e) => e.type === 'MANUAL').length;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Tiempo
      </h4>

      <div className="space-y-1.5 text-sm">
        {/* Total time */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Registrado</span>
          <span className="font-medium">
            {stats.totalMinutes > 0 ? formatMinutes(stats.totalMinutes) : '—'}
          </span>
        </div>

        {/* Pomodoro count */}
        {stats.pomodoroSessions > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Timer className="h-3 w-3" />
              Pomodoros
            </span>
            <span className="font-medium">{stats.pomodoroSessions}</span>
          </div>
        )}

        {/* Manual count */}
        {manualSessions > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock4 className="h-3 w-3" />
              Cronómetro
            </span>
            <span className="font-medium">{manualSessions}</span>
          </div>
        )}

        {/* Estimated time */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />
            Estimado
          </span>
          {editingEstimate ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                value={estimateValue}
                onChange={(e) => setEstimateValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEstimate();
                  if (e.key === 'Escape') setEditingEstimate(false);
                }}
                onBlur={handleSaveEstimate}
                className="h-6 w-16 text-xs"
                placeholder="min"
                autoFocus
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          ) : (
            <button
              className="font-medium hover:text-primary cursor-pointer"
              onClick={() => {
                setEstimateValue(
                  stats.estimatedTimeMinutes?.toString() || ''
                );
                setEditingEstimate(true);
              }}
            >
              {stats.estimatedTimeMinutes
                ? formatMinutes(stats.estimatedTimeMinutes)
                : 'Establecer'}
            </button>
          )}
        </div>

        {/* Progress bar */}
        {percentage !== null && (
          <div className="pt-1">
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  percentage >= 100 ? 'bg-red-500' : 'bg-primary'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
              {percentage}% del estimado
            </p>
          </div>
        )}
      </div>

      {/* Entries toggle */}
      {entries.length > 0 && (
        <div className="pt-1">
          <button
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => setShowEntries(!showEntries)}
          >
            {showEntries ? 'Ocultar registros' : `Ver registros (${entries.length})`}
          </button>

          {showEntries && (
            <div className={`mt-2 space-y-1 overflow-y-auto ${expanded ? 'max-h-72' : 'max-h-40'}`}>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded px-2 py-1 text-xs hover:bg-accent/50 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                        entry.type === 'POMODORO' ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                    />
                    <span className="text-muted-foreground truncate">
                      {format(new Date(entry.startedAt), 'dd MMM HH:mm', {
                        locale: es,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="font-medium">
                      {formatMinutes(entry.durationMinutes)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
