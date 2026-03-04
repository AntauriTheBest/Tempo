import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, Circle } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MonthlyClientReport } from '@todo-list-pro/shared';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export function MonthlyTrackingPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyClientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getMonthlyReport(year, month);
      setReport(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await adminService.generateMonthlyTasks(year, month);
      await fetchReport();
      const msg = result.generated > 0
        ? `${result.generated} tarea(s) generada(s)`
        : 'Todas las tareas ya estaban generadas';
      alert(msg);
    } catch {
      alert('Error al generar tareas');
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = (clientId: string) => {
    setExpandedClient((prev) => (prev === clientId ? null : clientId));
  };

  if (loading && report.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={handleGenerate} disabled={generating}>
          <RefreshCw className={cn('mr-2 h-4 w-4', generating && 'animate-spin')} />
          {generating ? 'Generando...' : 'Generar tareas del mes'}
        </Button>
      </div>

      {/* Client cards */}
      {report.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No hay tareas recurrentes configuradas</p>
          <p className="text-sm mt-1">
            Crea tareas recurrentes en las listas de tus clientes para verlas aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {report.map((clientReport) => {
            const { client, totalTemplates, completedInstances } = clientReport;
            const progress = totalTemplates > 0
              ? Math.round((completedInstances / totalTemplates) * 100)
              : 0;
            const isExpanded = expandedClient === client.id;

            return (
              <Card key={client.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Client summary row */}
                  <button
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => toggleExpand(client.id)}
                  >
                    <span
                      className="h-4 w-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: client.color }}
                    />
                    <span className="font-medium flex-1">{client.name}</span>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            progress === 100 ? 'bg-green-500' : 'bg-primary'
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {completedInstances}/{totalTemplates}
                      </span>
                    </div>

                    {progress === 100 && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/30">
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Tarea</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Asignados</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Estado</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Completada</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientReport.tasks.map((task) => (
                            <tr key={task.templateId} className="border-t last:border-0">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {task.status === 'COMPLETED' ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className={cn(
                                    'text-sm',
                                    task.status === 'COMPLETED' && 'line-through text-muted-foreground'
                                  )}>
                                    {task.templateTitle}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  {task.assignees.map((a) => (
                                    <span
                                      key={a.id}
                                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary"
                                      title={a.name}
                                    >
                                      {a.name.charAt(0).toUpperCase()}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {task.instanceId ? (
                                  <Badge
                                    variant="secondary"
                                    className={cn('text-xs', STATUS_COLORS[task.status])}
                                  >
                                    {STATUS_LABELS[task.status] || task.status}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    Sin generar
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {task.completedAt
                                  ? format(new Date(task.completedAt), 'dd MMM yyyy', { locale: es })
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
