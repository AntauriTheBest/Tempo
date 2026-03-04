import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '../ui/card';
import type { TimeByUserItem } from '@todo-list-pro/shared';

interface TimeByUserChartProps {
  data: TimeByUserItem[];
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as TimeByUserItem;
  return (
    <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
      <p className="font-medium">{item.userName}</p>
      <p className="text-muted-foreground">Tiempo: {formatMinutes(item.totalMinutes)}</p>
      <p className="text-muted-foreground">Tareas completadas: {item.taskCount}</p>
    </div>
  );
}

export function TimeByUserChart({ data }: TimeByUserChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
            Tiempo por usuario
          </h3>
          <p className="text-sm text-muted-foreground text-center py-8">
            Sin registros de tiempo en este periodo
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    hours: Math.round((item.totalMinutes / 60) * 10) / 10,
  }));

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
          Tiempo por usuario
        </h3>
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}h`}
              className="text-xs fill-muted-foreground"
            />
            <YAxis
              type="category"
              dataKey="userName"
              width={120}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="hours" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    );
}
