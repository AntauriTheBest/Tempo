import { useEffect, useState, useRef, useMemo } from 'react';
import { addDays, differenceInDays, format, startOfDay, isToday, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiClient } from '../services/api-client';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface GanttTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  dueDate?: string | null;
  list?: { name: string; color: string } | null;
  assignees: { id: string; name: string; avatar?: string | null }[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const ROW_H = 40;
const LABEL_W = 220;
const DAY_W = 32;

const STATUS_BAR: Record<string, string> = {
  PENDING:     'bg-slate-400',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED:   'bg-green-500',
  CANCELLED:   'bg-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#3b82f6', NONE: '#94a3b8',
};

// ── Component ────────────────────────────────────────────────────────────────

export function GanttPage() {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return startOfDay(d);
  });
  const [days, setDays] = useState(42); // 6 weeks default
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/tasks?limit=100&sortBy=dueDate&sortDir=asc')
      .then((res) => {
        const data: GanttTask[] = res.data.data ?? [];
        setTasks(data.filter((t) => t.dueDate));
      })
      .catch(() => toast.error('Error al cargar las tareas'))
      .finally(() => setLoading(false));
  }, []);

  // Scroll to today on load
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const todayOffset = differenceInDays(startOfDay(new Date()), viewStart);
      scrollRef.current.scrollLeft = Math.max(0, todayOffset * DAY_W - 100);
    }
  }, [loading, viewStart]);

  const viewEnd = useMemo(() => addDays(viewStart, days), [viewStart, days]);

  const dateColumns = useMemo(() => {
    const cols: Date[] = [];
    for (let i = 0; i < days; i++) cols.push(addDays(viewStart, i));
    return cols;
  }, [viewStart, days]);

  // Group dates by month for header
  const monthGroups = useMemo(() => {
    const groups: { label: string; count: number }[] = [];
    let cur = '';
    let count = 0;
    for (const d of dateColumns) {
      const m = format(d, 'MMMM yyyy', { locale: es });
      if (m !== cur) {
        if (cur) groups.push({ label: cur, count });
        cur = m; count = 1;
      } else {
        count++;
      }
    }
    if (cur) groups.push({ label: cur, count });
    return groups;
  }, [dateColumns]);

  const shiftView = (delta: number) => {
    setViewStart((d) => addDays(d, delta));
  };

  const getBarProps = (task: GanttTask) => {
    if (!task.dueDate) return null;
    const start = startOfDay(new Date(task.createdAt));
    const end = startOfDay(new Date(task.dueDate));
    const barStart = isBefore(start, viewStart) ? viewStart : start;
    const barEnd = isAfter(end, viewEnd) ? viewEnd : end;
    const left = differenceInDays(barStart, viewStart) * DAY_W;
    const width = Math.max(DAY_W, differenceInDays(barEnd, barStart) * DAY_W);
    return { left, width };
  };

  const isOverdue = (task: GanttTask) =>
    task.dueDate &&
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED' &&
    isBefore(new Date(task.dueDate), new Date());

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">Diagrama de Gantt</h1>
          {!loading && (
            <span className="text-xs text-muted-foreground">{tasks.length} tareas con fecha límite</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex items-center gap-1 rounded-md border text-xs overflow-hidden">
            {[14, 28, 42, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2 py-1 transition-colors ${days === d ? 'bg-primary text-white' : 'hover:bg-accent'}`}
              >
                {d === 14 ? '2sem' : d === 28 ? '4sem' : d === 42 ? '6sem' : '3mes'}
              </button>
            ))}
          </div>
          <button onClick={() => shiftView(-14)} className="rounded p-1.5 hover:bg-accent" title="Atrás 2 semanas">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewStart(() => { const d = new Date(); d.setDate(d.getDate() - 7); return startOfDay(d); })}
            className="rounded border px-2 py-1 text-xs hover:bg-accent transition-colors"
          >
            Hoy
          </button>
          <button onClick={() => shiftView(14)} className="rounded p-1.5 hover:bg-accent" title="Adelante 2 semanas">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setLoading(true); apiClient.get('/tasks?limit=100&sortBy=dueDate&sortDir=asc').then((r) => { setTasks(r.data.data?.filter((t: GanttTask) => t.dueDate) ?? []); }).catch(() => toast.error('Error')).finally(() => setLoading(false)); }}
            className="rounded p-1.5 hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="font-medium text-gray-500">Sin tareas con fecha límite</p>
          <p className="text-sm text-gray-400 mt-1">Asigna fechas límite a tus tareas para verlas aquí.</p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: task labels */}
          <div className="flex-shrink-0 overflow-y-auto border-r" style={{ width: LABEL_W }}>
            {/* Header spacer */}
            <div className="border-b bg-gray-50" style={{ height: 2 * ROW_H }} />
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{ height: ROW_H }}
                className={`flex items-center gap-2 border-b px-3 text-sm transition-colors ${hoveredTask === task.id ? 'bg-accent' : ''}`}
                onMouseEnter={() => setHoveredTask(task.id)}
                onMouseLeave={() => setHoveredTask(null)}
              >
                {/* Priority dot */}
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.NONE }}
                />
                {/* List color */}
                {task.list && (
                  <div className="h-2 w-2 rounded-sm flex-shrink-0" style={{ backgroundColor: task.list.color }} />
                )}
                <span className="truncate flex-1 leading-tight" title={task.title}>{task.title}</span>
                {isOverdue(task) && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />}
              </div>
            ))}
          </div>

          {/* Right: timeline */}
          <div ref={scrollRef} className="flex-1 overflow-auto">
            <div style={{ width: days * DAY_W, minWidth: '100%' }}>
              {/* Month header */}
              <div className="flex border-b bg-gray-50 sticky top-0 z-10" style={{ height: ROW_H }}>
                {monthGroups.map((g) => (
                  <div
                    key={g.label}
                    className="flex-shrink-0 border-r px-2 flex items-center text-xs font-semibold text-gray-600 capitalize"
                    style={{ width: g.count * DAY_W }}
                  >
                    {g.label}
                  </div>
                ))}
              </div>

              {/* Day header */}
              <div className="flex border-b bg-gray-50 sticky top-[40px] z-10" style={{ height: ROW_H }}>
                {dateColumns.map((d) => {
                  const todayLine = isToday(d);
                  const weekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={d.toISOString()}
                      className={`flex-shrink-0 border-r flex flex-col items-center justify-center text-xs ${
                        todayLine ? 'bg-primary/10 font-bold text-primary' :
                        weekend ? 'text-gray-400' : 'text-gray-500'
                      }`}
                      style={{ width: DAY_W }}
                    >
                      <span>{format(d, 'd')}</span>
                      <span className="text-[9px] uppercase">{format(d, 'EEE', { locale: es })}</span>
                    </div>
                  );
                })}
              </div>

              {/* Task rows */}
              <div className="relative">
                {/* Today vertical line */}
                {isAfter(new Date(), viewStart) && isBefore(new Date(), viewEnd) && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-primary/50 z-20 pointer-events-none"
                    style={{ left: differenceInDays(startOfDay(new Date()), viewStart) * DAY_W + DAY_W / 2 }}
                  />
                )}

                {tasks.map((task) => {
                  const bar = getBarProps(task);
                  const weekend = (col: Date) => col.getDay() === 0 || col.getDay() === 6;

                  return (
                    <div
                      key={task.id}
                      style={{ height: ROW_H }}
                      className={`relative flex border-b transition-colors ${hoveredTask === task.id ? 'bg-accent/50' : ''}`}
                      onMouseEnter={() => setHoveredTask(task.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                    >
                      {/* Weekend shading */}
                      {dateColumns.map((d, i) => (
                        weekend(d) ? (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 bg-gray-100/60"
                            style={{ left: i * DAY_W, width: DAY_W }}
                          />
                        ) : null
                      ))}

                      {/* Bar */}
                      {bar && (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 rounded-md ${STATUS_BAR[task.status] ?? STATUS_BAR.PENDING} opacity-85 flex items-center px-2`}
                          style={{ left: bar.left, width: bar.width, height: 24 }}
                          title={`${task.title} — ${STATUS_LABELS[task.status]}\nVence: ${task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy', { locale: es }) : '—'}`}
                        >
                          <span className="text-white text-[10px] font-medium truncate leading-none">
                            {bar.width > 60 ? task.title : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 border-t px-4 py-2 bg-white flex-shrink-0">
        {Object.entries(STATUS_BAR).map(([s, cls]) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={`h-2.5 w-5 rounded-sm ${cls}`} />
            {STATUS_LABELS[s]}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-4">
          <AlertTriangle className="h-3 w-3 text-red-400" />
          Vencida
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-4 w-px bg-primary/50" />
          Hoy
        </div>
      </div>
    </div>
  );
}
