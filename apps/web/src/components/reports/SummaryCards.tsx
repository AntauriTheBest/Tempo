import { Clock, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import type { ReportSummary } from '@todo-list-pro/shared';

interface SummaryCardsProps {
  summary: ReportSummary;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      icon: Clock,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600',
      value: summary.totalTimeMinutes > 0 ? formatMinutes(summary.totalTimeMinutes) : '0m',
      label: 'Tiempo registrado',
    },
    {
      icon: CheckSquare,
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600',
      value: summary.completedTasks.toString(),
      label: 'Completadas',
    },
    {
      icon: TrendingUp,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600',
      value: `${summary.completionRate}%`,
      label: 'Tasa de completitud',
    },
    {
      icon: AlertCircle,
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600',
      value: (summary.pendingTasks + summary.inProgressTasks).toString(),
      label: 'Tareas activas',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
