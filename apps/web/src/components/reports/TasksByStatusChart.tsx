import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent } from '../ui/card';

interface TasksByStatusChartProps {
  data: Record<string, number>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: '#eab308' },
  IN_PROGRESS: { label: 'En progreso', color: '#3b82f6' },
  COMPLETED: { label: 'Completada', color: '#22c55e' },
  CANCELLED: { label: 'Cancelada', color: '#94a3b8' },
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">{value} tareas</p>
    </div>
  );
}

export function TasksByStatusChart({ data }: TasksByStatusChartProps) {
  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label ?? status,
      value: count,
      color: STATUS_CONFIG[status]?.color ?? '#94a3b8',
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
            Tareas por estado
          </h3>
          <p className="text-sm text-muted-foreground text-center py-8">
            Sin tareas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
          Tareas por estado
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
