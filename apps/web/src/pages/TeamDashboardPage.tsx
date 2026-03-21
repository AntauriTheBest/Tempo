import { useEffect, useState } from 'react';
import { Users, CheckCircle2, Clock, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { teamService } from '../services/team.service';
import { toast } from 'sonner';

interface MemberStats {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  total: number;
  active: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

interface OrgSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

interface OverdueTask {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  assignees: { id: string; name: string; avatar: string | null }[];
}

interface RecentTask {
  id: string;
  title: string;
  completedAt: string;
  assignees: { id: string; name: string; avatar: string | null }[];
}

interface TeamDashboardData {
  summary: OrgSummary;
  workload: MemberStats[];
  overdueTasks: OverdueTask[];
  recentActivity: RecentTask[];
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-blue-100 text-blue-700',
  NONE: 'bg-gray-100 text-gray-600',
};

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: 'Urgente', HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja', NONE: '—',
};

function Avatar({ name, avatar, size = 8 }: { name: string; avatar?: string | null; size?: number }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`h-${size} w-${size} rounded-full object-cover ring-2 ring-white`}
      />
    );
  }
  return (
    <div
      className={`h-${size} w-${size} rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs ring-2 ring-white`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function TeamDashboardPage() {
  const [data, setData] = useState<TeamDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teamService.getDashboard()
      .then(setData)
      .catch(() => toast.error('Error al cargar el dashboard del equipo'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  const { summary, workload, overdueTasks, recentActivity } = data;
  const completionRate = summary.total > 0
    ? Math.round((summary.completed / summary.total) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Dashboard del equipo</h1>
      </div>

      {/* ── Summary cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          icon={<Activity className="h-5 w-5 text-blue-600" />}
          label="Total tareas"
          value={summary.total}
          bg="bg-blue-50"
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          label="Completadas"
          value={summary.completed}
          sub={`${completionRate}% tasa`}
          bg="bg-green-50"
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5 text-purple-600" />}
          label="En progreso"
          value={summary.inProgress}
          bg="bg-purple-50"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          label="Vencidas"
          value={summary.overdue}
          bg="bg-red-50"
          highlight={summary.overdue > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Workload table ──────────────────────────────── */}
        <div className="lg:col-span-2 rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Carga de trabajo por miembro</h2>
          </div>
          <div className="divide-y">
            {workload.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">Sin miembros</p>
            )}
            {workload.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={m.name} avatar={m.avatar} size={9} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    {m.role === 'ADMIN' && (
                      <span className="text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5 font-medium">Admin</span>
                    )}
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${m.completionRate}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-right flex-shrink-0">
                  <div>
                    <p className="font-semibold">{m.active}</p>
                    <p className="text-muted-foreground">activas</p>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600">{m.completed}</p>
                    <p className="text-muted-foreground">hecha</p>
                  </div>
                  {m.overdue > 0 && (
                    <div>
                      <p className="font-semibold text-red-500">{m.overdue}</p>
                      <p className="text-muted-foreground">vencida</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ───────────────────────────────── */}
        <div className="space-y-6">
          {/* Overdue tasks */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h2 className="text-sm font-semibold">Tareas vencidas</h2>
              {overdueTasks.length > 0 && (
                <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                  {overdueTasks.length}
                </span>
              )}
            </div>
            <div className="divide-y max-h-72 overflow-y-auto">
              {overdueTasks.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                  Sin tareas vencidas 🎉
                </p>
              ) : overdueTasks.map((t) => (
                <div key={t.id} className="px-4 py-2.5 space-y-1">
                  <p className="text-sm font-medium leading-snug line-clamp-1">{t.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${PRIORITY_COLORS[t.priority]}`}>
                      {PRIORITY_LABELS[t.priority]}
                    </span>
                    <span className="text-xs text-red-500">
                      Venció {formatDistanceToNow(new Date(t.dueDate), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  {t.assignees.length > 0 && (
                    <div className="flex -space-x-1">
                      {t.assignees.slice(0, 4).map((a) => (
                        <Avatar key={a.id} name={a.name} avatar={a.avatar} size={5} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <h2 className="text-sm font-semibold">Completadas este mes</h2>
            </div>
            <div className="divide-y max-h-72 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">Sin actividad</p>
              ) : recentActivity.map((t) => (
                <div key={t.id} className="px-4 py-2.5 space-y-1">
                  <p className="text-sm font-medium line-clamp-1">{t.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(t.completedAt), { addSuffix: true, locale: es })}
                    </span>
                    {t.assignees.length > 0 && (
                      <div className="flex -space-x-1 ml-auto">
                        {t.assignees.slice(0, 3).map((a) => (
                          <Avatar key={a.id} name={a.name} avatar={a.avatar} size={5} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon, label, value, sub, bg, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  bg: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${highlight ? 'ring-2 ring-red-300' : ''}`}>
      <div className={`mb-3 inline-flex rounded-lg p-2 ${bg}`}>{icon}</div>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs font-medium text-primary mt-1">{sub}</p>}
    </div>
  );
}
