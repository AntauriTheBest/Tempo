import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '../ui/card';
import type { CompletedOverTimeItem } from '@todo-list-pro/shared';

interface CompletedOverTimeChartProps {
  data: CompletedOverTimeItem[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
      <p className="font-medium">{formatDate(label)}</p>
      <p className="text-muted-foreground">{payload[0].value} completadas</p>
    </div>
  );
}

export function CompletedOverTimeChart({ data }: CompletedOverTimeChartProps) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
            Tareas completadas por día
          </h3>
          <p className="text-sm text-muted-foreground text-center py-8">
            Sin tareas completadas en este periodo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
          Tareas completadas por día
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ left: 0, right: 10, top: 5 }}>
            <defs>
              <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#completedGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
