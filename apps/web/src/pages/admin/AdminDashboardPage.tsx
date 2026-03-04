import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, CheckSquare, Clock, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AdminUserListItem, MonthlyClientReport } from '@todo-list-pro/shared';

interface AdminTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  category: { id: string; name: string; color: string } | null;
  list: { id: string; name: string; color: string; client: { id: string; name: string; color: string } | null } | null;
  _count: { subtasks: number };
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const PRIORITY_LABELS: Record<string, string> = {
  NONE: '-',
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'text-red-600 font-semibold',
  HIGH: 'text-orange-600 font-medium',
  MEDIUM: 'text-yellow-600',
  LOW: 'text-blue-600',
  NONE: 'text-muted-foreground',
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyClientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    userId: '',
    priority: '',
    sortBy: 'createdAt',
    sortDir: 'desc' as 'asc' | 'desc',
    page: 1,
  });
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const [statsRes, tasksRes, usersRes, monthlyRes] = await Promise.all([
        adminService.getStats(),
        adminService.getTasks({
          search: filters.search || undefined,
          status: filters.status || undefined,
          userId: filters.userId || undefined,
          priority: filters.priority || undefined,
          sortBy: filters.sortBy,
          sortDir: filters.sortDir,
          page: filters.page,
          limit: 25,
        }),
        adminService.getUsers(1, 100),
        adminService.getMonthlyReport(now.getFullYear(), now.getMonth() + 1).catch(() => []),
      ]);
      setStats(statsRes);
      setTasks(tasksRes.data);
      setTotalPages(tasksRes.meta.totalPages);
      setUsers(usersRes.data);
      setMonthlyReport(monthlyRes);
    } catch {
      // Error silently handled
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', userId: '', priority: '', sortBy: 'createdAt', sortDir: 'desc', page: 1 });
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const hasActiveFilters = filters.search || filters.status || filters.userId || filters.priority;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      {/* Stats cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Usuarios activos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
                <p className="text-xs text-muted-foreground">Total tareas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats.tasksByStatus.PENDING || 0) + (stats.tasksByStatus.IN_PROGRESS || 0)}</p>
                <p className="text-xs text-muted-foreground">Tareas activas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <AlertCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.tasksByStatus.COMPLETED || 0}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Igualas del mes */}
      {monthlyReport.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Igualas del mes
            </h3>
            <Button
              variant="link"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/admin/monthly')}
            >
              Ver detalle →
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {monthlyReport.map((r) => {
              const progress = r.totalTemplates > 0
                ? Math.round((r.completedInstances / r.totalTemplates) * 100)
                : 0;
              return (
                <div
                  key={r.client.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: r.client.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.client.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            progress === 100 ? 'bg-green-500' : 'bg-primary'
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {r.completedInstances}/{r.totalTemplates}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.userId}
          onChange={(e) => updateFilter('userId', e.target.value)}
        >
          <option value="">Todos los usuarios</option>
          {users.filter((u) => u.isActive).map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.priority}
          onChange={(e) => updateFilter('priority', e.target.value)}
        >
          <option value="">Todas las prioridades</option>
          <option value="URGENT">Urgente</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Media</option>
          <option value="LOW">Baja</option>
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Tasks table */}
      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {[
                { label: 'Tarea', field: 'title' },
                { label: 'Usuario', field: 'user' },
                { label: 'Lista', field: 'list' },
                { label: 'Estado', field: 'status' },
                { label: 'Prioridad', field: 'priority' },
                { label: 'Fecha límite', field: 'dueDate' },
              ].map(({ label, field }) => {
                const isActive = filters.sortBy === field;
                return (
                  <th key={field} className="px-4 py-3 text-left text-sm font-medium">
                    <button
                      className={cn(
                        'flex items-center gap-1 hover:text-foreground transition-colors',
                        isActive && 'text-foreground'
                      )}
                      onClick={() => handleSort(field)}
                    >
                      {label}
                      {isActive && (
                        filters.sortDir === 'asc'
                          ? <ArrowUp className="h-3 w-3" />
                          : <ArrowDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron tareas
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.category && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: task.category.color }}
                          />
                          <span className="text-xs text-muted-foreground">{task.category.name}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {task.user.name}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {task.list ? (
                      <div className="flex items-center gap-1">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: task.list.color }}
                        />
                        <span>{task.list.name}</span>
                        {task.list.client && (
                          <span className="text-xs text-muted-foreground">
                            ({task.list.client.name})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', STATUS_COLORS[task.status])}
                    >
                      {STATUS_LABELS[task.status] || task.status}
                    </Badge>
                  </td>
                  <td className={cn('px-4 py-3 text-sm', PRIORITY_COLORS[task.priority])}>
                    {PRIORITY_LABELS[task.priority] || task.priority}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {task.dueDate
                      ? format(new Date(task.dueDate), 'dd MMM yyyy', { locale: es })
                      : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {filters.page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page >= totalPages}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
