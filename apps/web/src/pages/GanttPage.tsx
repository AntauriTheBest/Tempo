import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
  startDate?: string | null;
  createdAt: string;
  dueDate?: string | null;
  list?: { name: string; color: string } | null;
  assignees: { id: string; name: string; avatar?: string | null }[];
}

interface GanttEdge {
  taskId: string;       // blocked task
  dependsOnId: string;  // must finish first
}

// ── Constants ────────────────────────────────────────────────────────────────

const ROW_H = 40;
const LABEL_W = 220;
const DAY_W = 32;
const ARROW_MARGIN = 8; // px gap for elbow routing

const STATUS_BAR_CLS: Record<string, string> = {
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

// ── Dependency arrow path (finish-to-start connector) ────────────────────────

function buildArrowPath(
  x1: number, y1: number,   // right edge of "dependsOn" bar
  x2: number, y2: number,   // left  edge of "taskId" bar
): string {
  if (x2 > x1 + ARROW_MARGIN * 2) {
    // Simple right-angle elbow
    const midX = x1 + ARROW_MARGIN;
    return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
  }
  // Back-edge: route around (go right, down/up, swing left, reach target)
  const rightX = x1 + ARROW_MARGIN;
  const leftX  = x2 - ARROW_MARGIN;
  const midY   = y1 < y2 ? y1 + ROW_H * 0.5 : y1 - ROW_H * 0.5;
  return [
    `M ${x1} ${y1}`,
    `L ${rightX} ${y1}`,
    `L ${rightX} ${midY}`,
    `L ${leftX} ${midY}`,
    `L ${leftX} ${y2}`,
    `L ${x2} ${y2}`,
  ].join(' ');
}

// ── Component ────────────────────────────────────────────────────────────────

export function GanttPage() {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [edges, setEdges] = useState<GanttEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeps, setShowDeps] = useState(true);
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return startOfDay(d);
  });
  const [days, setDays] = useState(42);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get('/tasks/graph')
      .then((res) => {
        const { nodes, edges: rawEdges } = res.data.data as { nodes: GanttTask[]; edges: GanttEdge[] };
        setTasks(nodes.filter((t) => t.dueDate));
        setEdges(rawEdges ?? []);
      })
      .catch(() => toast.error('Error al cargar las tareas'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const monthGroups = useMemo(() => {
    const groups: { label: string; count: number }[] = [];
    let cur = '';
    let count = 0;
    for (const d of dateColumns) {
      const m = format(d, 'MMMM yyyy', { locale: es });
      if (m !== cur) {
        if (cur) groups.push({ label: cur, count });
        cur = m; count = 1;
      } else { count++; }
    }
    if (cur) groups.push({ label: cur, count });
    return groups;
  }, [dateColumns]);

  const shiftView = (delta: number) => setViewStart((d) => addDays(d, delta));

  const getBarProps = (task: GanttTask) => {
    if (!task.dueDate) return null;
    const start = startOfDay(new Date(task.startDate ?? task.createdAt));
    const end   = startOfDay(new Date(task.dueDate));
    const barStart = isBefore(start, viewStart) ? viewStart : start;
    const barEnd   = isAfter(end, viewEnd) ? viewEnd : end;
    const left  = differenceInDays(barStart, viewStart) * DAY_W;
    const width = Math.max(DAY_W, differenceInDays(barEnd, barStart) * DAY_W);
    // Raw pixel positions (unclamped) for dependency arrows
    const rawLeft  = differenceInDays(start, viewStart) * DAY_W;
    const rawRight = differenceInDays(end,   viewStart) * DAY_W;
    return { left, width, rawLeft, rawRight };
  };

  const isOverdue = (task: GanttTask) =>
    task.dueDate &&
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED' &&
    isBefore(new Date(task.dueDate), new Date());

  // Build index: taskId → row index (within the visible tasks array)
  const taskRowIndex = useMemo(
    () => new Map(tasks.map((t, i) => [t.id, i])),
    [tasks]
  );

  // Compute dependency arrow segments
  const arrows = useMemo(() => {
    if (!showDeps) return [];
    return edges.flatMap((e) => {
      const fromRow = taskRowIndex.get(e.dependsOnId);
      const toRow   = taskRowIndex.get(e.taskId);
      if (fromRow === undefined || toRow === undefined) return [];

      const fromTask = tasks[fromRow];
      const toTask   = tasks[toRow];
      const fromBar  = getBarProps(fromTask);
      const toBar    = getBarProps(toTask);
      if (!fromBar || !toBar) return [];

      const x1 = fromBar.rawRight;         // right edge of "must finish" bar
      const y1 = fromRow * ROW_H + ROW_H / 2;
      const x2 = toBar.rawLeft;            // left edge of "blocked" bar
      const y2 = toRow   * ROW_H + ROW_H / 2;

      const isViolation =
        toTask.startDate && fromTask.dueDate
          ? new Date(toTask.startDate) < new Date(fromTask.dueDate)
          : false;

      return [{ path: buildArrowPath(x1, y1, x2, y2), isViolation, fromId: e.dependsOnId, toId: e.taskId }];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, tasks, taskRowIndex, viewStart, showDeps]);

  const svgH = tasks.length * ROW_H;
  const svgW = days * DAY_W;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">Diagrama de Gantt</h1>
          {!loading && (
            <span className="text-xs text-muted-foreground">
              {tasks.length} tareas · {edges.length} dependencias
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Show deps toggle */}
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDeps}
              onChange={(e) => setShowDeps(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Dependencias
          </label>

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
          <button onClick={load} className="rounded p-1.5 hover:bg-accent">
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
            <div className="border-b bg-gray-50" style={{ height: 2 * ROW_H }} />
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{ height: ROW_H }}
                className={`flex items-center gap-2 border-b px-3 text-sm transition-colors ${hoveredTask === task.id ? 'bg-accent' : ''}`}
                onMouseEnter={() => setHoveredTask(task.id)}
                onMouseLeave={() => setHoveredTask(null)}
              >
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.NONE }}
                />
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
            <div style={{ width: svgW, minWidth: '100%' }}>
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
                        weekend   ? 'text-gray-400' : 'text-gray-500'
                      }`}
                      style={{ width: DAY_W }}
                    >
                      <span>{format(d, 'd')}</span>
                      <span className="text-[9px] uppercase">{format(d, 'EEE', { locale: es })}</span>
                    </div>
                  );
                })}
              </div>

              {/* Task rows + dependency SVG overlay */}
              <div className="relative" style={{ height: svgH }}>
                {/* Today vertical line */}
                {isAfter(new Date(), viewStart) && isBefore(new Date(), viewEnd) && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-primary/50 z-20 pointer-events-none"
                    style={{ left: differenceInDays(startOfDay(new Date()), viewStart) * DAY_W + DAY_W / 2 }}
                  />
                )}

                {/* Task rows */}
                {tasks.map((task, idx) => {
                  const bar = getBarProps(task);
                  const weekend = (col: Date) => col.getDay() === 0 || col.getDay() === 6;
                  return (
                    <div
                      key={task.id}
                      style={{ height: ROW_H, top: idx * ROW_H }}
                      className={`absolute left-0 right-0 flex border-b transition-colors ${hoveredTask === task.id ? 'bg-accent/50' : ''}`}
                      onMouseEnter={() => setHoveredTask(task.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                    >
                      {/* Weekend shading */}
                      {dateColumns.map((d, i) =>
                        weekend(d) ? (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 bg-gray-100/60"
                            style={{ left: i * DAY_W, width: DAY_W }}
                          />
                        ) : null
                      )}

                      {/* Bar */}
                      {bar && (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 rounded-md ${STATUS_BAR_CLS[task.status] ?? STATUS_BAR_CLS.PENDING} opacity-85 flex items-center px-2`}
                          style={{ left: bar.left, width: bar.width, height: 24 }}
                          title={`${task.title} — ${STATUS_LABELS[task.status]}\nInicio: ${task.startDate ? format(new Date(task.startDate), 'dd MMM yyyy', { locale: es }) : '—'}\nVence: ${task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy', { locale: es }) : '—'}`}
                        >
                          <span className="text-white text-[10px] font-medium truncate leading-none">
                            {bar.width > 60 ? task.title : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* SVG dependency arrows */}
                {showDeps && arrows.length > 0 && (
                  <svg
                    className="absolute top-0 left-0 pointer-events-none z-30"
                    width={svgW}
                    height={svgH}
                    overflow="visible"
                  >
                    <defs>
                      <marker id="arrow-normal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#6366f1" />
                      </marker>
                      <marker id="arrow-violation" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
                      </marker>
                    </defs>
                    {arrows.map((a, i) => (
                      <path
                        key={i}
                        d={a.path}
                        fill="none"
                        stroke={a.isViolation ? '#ef4444' : '#6366f1'}
                        strokeWidth={a.isViolation ? 1.5 : 1.5}
                        strokeDasharray={a.isViolation ? '4 3' : undefined}
                        markerEnd={a.isViolation ? 'url(#arrow-violation)' : 'url(#arrow-normal)'}
                        opacity={
                          hoveredTask && (hoveredTask === a.fromId || hoveredTask === a.toId)
                            ? 1
                            : 0.45
                        }
                      />
                    ))}
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 border-t px-4 py-2 bg-white flex-shrink-0 flex-wrap">
        {Object.entries(STATUS_BAR_CLS).map(([s, cls]) => (
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
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <svg width="20" height="10"><path d="M0,5 L14,5" stroke="#6366f1" strokeWidth="1.5" markerEnd="url(#arrow-normal)" fill="none" /><defs><marker id="arrow-normal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#6366f1" /></marker></defs></svg>
          Dependencia
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <svg width="20" height="10"><path d="M0,5 L14,5" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow-violation)" fill="none" /><defs><marker id="arrow-violation" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker></defs></svg>
          Violación de fechas
        </div>
      </div>
    </div>
  );
}
