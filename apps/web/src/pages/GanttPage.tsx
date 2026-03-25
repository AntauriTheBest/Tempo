import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { addDays, differenceInDays, format, startOfDay, isToday, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiClient } from '../services/api-client';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  taskId: string;
  dependsOnId: string;
}

interface DragOrigin {
  taskId: string;
  mouseX: number;
  effectiveStart: Date; // startDate or today if missing
  dueDate: Date;
  hasOriginalStart: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROW_H = 40;
const LABEL_W = 220;
const DAY_W = 32;
const ARROW_MARGIN = 8;

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

// ── Arrow path helper ──────────────────────────────────────────────────────────

function buildArrowPath(x1: number, y1: number, x2: number, y2: number): string {
  if (x2 > x1 + ARROW_MARGIN * 2) {
    const midX = x1 + ARROW_MARGIN;
    return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
  }
  const rightX = x1 + ARROW_MARGIN;
  const leftX  = x2 - ARROW_MARGIN;
  const midY   = y1 < y2 ? y1 + ROW_H * 0.5 : y1 - ROW_H * 0.5;
  return [`M ${x1} ${y1}`, `L ${rightX} ${y1}`, `L ${rightX} ${midY}`,
          `L ${leftX} ${midY}`, `L ${leftX} ${y2}`, `L ${x2} ${y2}`].join(' ');
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GanttPage() {
  const [tasks, setTasks]       = useState<GanttTask[]>([]);
  const [edges, setEdges]       = useState<GanttEdge[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showDeps, setShowDeps] = useState(true);
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return startOfDay(d);
  });
  const [days, setDays] = useState(42);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // ── Drag state ──────────────────────────────────────────────────────────────
  const dragOrigin = useRef<DragOrigin | null>(null);
  const [draggingId, setDraggingId]         = useState<string | null>(null);
  const [dragDayOffset, setDragDayOffset]   = useState(0);
  const [saving, setSaving]                 = useState<string | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (!loading && scrollRef.current) {
      const todayOffset = differenceInDays(startOfDay(new Date()), viewStart);
      scrollRef.current.scrollLeft = Math.max(0, todayOffset * DAY_W - 100);
    }
  }, [loading, viewStart]);

  // ── Mouse drag handlers (attached to window) ─────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragOrigin.current) return;
      const deltaX    = e.clientX - dragOrigin.current.mouseX;
      const dayOffset = Math.round(deltaX / DAY_W);
      setDragDayOffset(dayOffset);
    };

    const onMouseUp = async () => {
      const origin = dragOrigin.current;
      if (!origin) return;
      dragOrigin.current = null;

      const dayOffset = dragDayOffset;
      setDraggingId(null);
      setDragDayOffset(0);

      if (dayOffset === 0) return;

      const newStart = startOfDay(addDays(origin.effectiveStart, dayOffset));
      const newEnd   = startOfDay(addDays(origin.dueDate, dayOffset));

      // Optimistic update
      setTasks((prev) => prev.map((t) =>
        t.id === origin.taskId
          ? { ...t, startDate: newStart.toISOString(), dueDate: newEnd.toISOString() }
          : t
      ));

      setSaving(origin.taskId);
      try {
        await apiClient.patch(`/tasks/${origin.taskId}`, {
          startDate: newStart.toISOString(),
          dueDate:   newEnd.toISOString(),
        });
        toast.success('Fechas actualizadas');
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Error al guardar las fechas');
        // Revert
        load();
      } finally {
        setSaving(null);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  // dragDayOffset needs to be stable in onMouseUp — capture via ref pattern
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragDayOffset, load]);

  const startBarDrag = (e: React.MouseEvent, task: GanttTask) => {
    e.preventDefault();
    e.stopPropagation();
    const effectiveStart = task.startDate
      ? startOfDay(new Date(task.startDate))
      : startOfDay(new Date());
    dragOrigin.current = {
      taskId: task.id,
      mouseX: e.clientX,
      effectiveStart,
      dueDate: startOfDay(new Date(task.dueDate!)),
      hasOriginalStart: !!task.startDate,
    };
    setDraggingId(task.id);
    setDragDayOffset(0);
  };

  // ── View helpers ─────────────────────────────────────────────────────────────
  const viewEnd = useMemo(() => addDays(viewStart, days), [viewStart, days]);

  const dateColumns = useMemo(() => {
    const cols: Date[] = [];
    for (let i = 0; i < days; i++) cols.push(addDays(viewStart, i));
    return cols;
  }, [viewStart, days]);

  const monthGroups = useMemo(() => {
    const groups: { label: string; count: number }[] = [];
    let cur = ''; let count = 0;
    for (const d of dateColumns) {
      const m = format(d, 'MMMM yyyy', { locale: es });
      if (m !== cur) { if (cur) groups.push({ label: cur, count }); cur = m; count = 1; }
      else count++;
    }
    if (cur) groups.push({ label: cur, count });
    return groups;
  }, [dateColumns]);

  const shiftView = (delta: number) => setViewStart((d) => addDays(d, delta));

  const getBarProps = useCallback((task: GanttTask, extraDays = 0) => {
    if (!task.dueDate) return null;
    const effectiveStart = task.startDate
      ? startOfDay(new Date(task.startDate))
      : startOfDay(new Date());
    const start = addDays(effectiveStart, extraDays);
    const end   = addDays(startOfDay(new Date(task.dueDate)), extraDays);
    const barStart = isBefore(start, viewStart) ? viewStart : start;
    const barEnd   = isAfter(end, viewEnd) ? viewEnd : end;
    const left  = differenceInDays(barStart, viewStart) * DAY_W;
    const width = Math.max(DAY_W, differenceInDays(barEnd, barStart) * DAY_W);
    const rawLeft  = differenceInDays(start, viewStart) * DAY_W;
    const rawRight = differenceInDays(end, viewStart) * DAY_W;
    return { left, width, rawLeft, rawRight, start, end };
  }, [viewStart, viewEnd]);

  const isOverdue = (task: GanttTask) =>
    task.dueDate && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' &&
    isBefore(new Date(task.dueDate), new Date());

  const taskRowIndex = useMemo(() => new Map(tasks.map((t, i) => [t.id, i])), [tasks]);

  const arrows = useMemo(() => {
    if (!showDeps) return [];
    return edges.flatMap((e) => {
      const fromRow = taskRowIndex.get(e.dependsOnId);
      const toRow   = taskRowIndex.get(e.taskId);
      if (fromRow === undefined || toRow === undefined) return [];
      const fromTask = tasks[fromRow];
      const toTask   = tasks[toRow];
      const fromOffset = fromTask.id === draggingId ? dragDayOffset : 0;
      const toOffset   = toTask.id   === draggingId ? dragDayOffset : 0;
      const fromBar = getBarProps(fromTask, fromOffset);
      const toBar   = getBarProps(toTask,   toOffset);
      if (!fromBar || !toBar) return [];
      const x1 = fromBar.rawRight; const y1 = fromRow * ROW_H + ROW_H / 2;
      const x2 = toBar.rawLeft;   const y2 = toRow   * ROW_H + ROW_H / 2;
      const isViolation =
        toTask.startDate && fromTask.dueDate
          ? new Date(toTask.startDate) < new Date(fromTask.dueDate)
          : false;
      return [{ path: buildArrowPath(x1, y1, x2, y2), isViolation, fromId: e.dependsOnId, toId: e.taskId }];
    });
  }, [edges, tasks, taskRowIndex, viewStart, showDeps, draggingId, dragDayOffset, getBarProps]);

  const svgH = tasks.length * ROW_H;
  const svgW = days * DAY_W;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ userSelect: draggingId ? 'none' : undefined, cursor: draggingId ? 'grabbing' : undefined }}
    >
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
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input type="checkbox" checked={showDeps} onChange={(e) => setShowDeps(e.target.checked)} className="h-3.5 w-3.5 accent-primary" />
            Dependencias
          </label>
          <div className="flex items-center gap-1 rounded-md border text-xs overflow-hidden">
            {[14, 28, 42, 90].map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-2 py-1 transition-colors ${days === d ? 'bg-primary text-white' : 'hover:bg-accent'}`}>
                {d === 14 ? '2sem' : d === 28 ? '4sem' : d === 42 ? '6sem' : '3mes'}
              </button>
            ))}
          </div>
          <button onClick={() => shiftView(-14)} className="rounded p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setViewStart(() => { const d = new Date(); d.setDate(d.getDate() - 7); return startOfDay(d); })}
            className="rounded border px-2 py-1 text-xs hover:bg-accent transition-colors">Hoy</button>
          <button onClick={() => shiftView(14)} className="rounded p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={load} className="rounded p-1.5 hover:bg-accent"><RefreshCw className="h-4 w-4" /></button>
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
          {/* Left labels */}
          <div className="flex-shrink-0 overflow-y-auto border-r" style={{ width: LABEL_W }}>
            <div className="border-b bg-gray-50" style={{ height: 2 * ROW_H }} />
            {tasks.map((task) => (
              <div key={task.id} style={{ height: ROW_H }}
                className={`flex items-center gap-2 border-b px-3 text-sm transition-colors ${hoveredTask === task.id ? 'bg-accent' : ''} ${saving === task.id ? 'opacity-60' : ''}`}
                onMouseEnter={() => setHoveredTask(task.id)}
                onMouseLeave={() => setHoveredTask(null)}
              >
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.NONE }} />
                {task.list && <div className="h-2 w-2 rounded-sm flex-shrink-0" style={{ backgroundColor: task.list.color }} />}
                <span className="truncate flex-1 leading-tight" title={task.title}>{task.title}</span>
                {saving === task.id && <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />}
                {isOverdue(task) && saving !== task.id && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />}
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div ref={scrollRef} className="flex-1 overflow-auto">
            <div style={{ width: svgW, minWidth: '100%' }}>
              {/* Month header */}
              <div className="flex border-b bg-gray-50 sticky top-0 z-10" style={{ height: ROW_H }}>
                {monthGroups.map((g) => (
                  <div key={g.label} className="flex-shrink-0 border-r px-2 flex items-center text-xs font-semibold text-gray-600 capitalize" style={{ width: g.count * DAY_W }}>
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
                    <div key={d.toISOString()} style={{ width: DAY_W }}
                      className={`flex-shrink-0 border-r flex flex-col items-center justify-center text-xs ${todayLine ? 'bg-primary/10 font-bold text-primary' : weekend ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span>{format(d, 'd')}</span>
                      <span className="text-[9px] uppercase">{format(d, 'EEE', { locale: es })}</span>
                    </div>
                  );
                })}
              </div>

              {/* Rows + SVG overlay */}
              <div className="relative" style={{ height: svgH }}>
                {/* Today line */}
                {isAfter(new Date(), viewStart) && isBefore(new Date(), viewEnd) && (
                  <div className="absolute top-0 bottom-0 w-px bg-primary/50 z-20 pointer-events-none"
                    style={{ left: differenceInDays(startOfDay(new Date()), viewStart) * DAY_W + DAY_W / 2 }} />
                )}

                {tasks.map((task, idx) => {
                  const isDragging = draggingId === task.id;
                  const extraDays  = isDragging ? dragDayOffset : 0;
                  const bar        = getBarProps(task, extraDays);
                  const weekend    = (col: Date) => col.getDay() === 0 || col.getDay() === 6;

                  // Tooltip dates (live during drag)
                  const effectiveStart = task.startDate ? startOfDay(new Date(task.startDate)) : startOfDay(new Date());
                  const previewStart   = addDays(effectiveStart, extraDays);
                  const previewEnd     = addDays(startOfDay(new Date(task.dueDate!)), extraDays);

                  return (
                    <div key={task.id} style={{ height: ROW_H, top: idx * ROW_H }}
                      className={`absolute left-0 right-0 flex border-b transition-colors ${hoveredTask === task.id ? 'bg-accent/50' : ''}`}
                      onMouseEnter={() => !draggingId && setHoveredTask(task.id)}
                      onMouseLeave={() => !draggingId && setHoveredTask(null)}
                    >
                      {/* Weekend shading */}
                      {dateColumns.map((d, i) =>
                        weekend(d) ? <div key={i} className="absolute top-0 bottom-0 bg-gray-100/60" style={{ left: i * DAY_W, width: DAY_W }} /> : null
                      )}

                      {/* Bar */}
                      {bar && (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 rounded-md ${STATUS_BAR_CLS[task.status] ?? STATUS_BAR_CLS.PENDING} flex items-center px-2 select-none
                            ${isDragging ? 'opacity-80 ring-2 ring-white shadow-lg z-40' : 'opacity-85 cursor-grab hover:opacity-100 hover:ring-1 hover:ring-white/50'}`}
                          style={{ left: bar.left, width: bar.width, height: 24, transition: isDragging ? 'none' : undefined }}
                          onMouseDown={(e) => startBarDrag(e, task)}
                          title={`${task.title}\nInicio: ${format(previewStart, 'dd MMM yyyy', { locale: es })}\nVence: ${format(previewEnd, 'dd MMM yyyy', { locale: es })}`}
                        >
                          <span className="text-white text-[10px] font-medium truncate leading-none pointer-events-none">
                            {bar.width > 60 ? task.title : ''}
                          </span>
                        </div>
                      )}

                      {/* Date tooltip during drag */}
                      {isDragging && bar && dragDayOffset !== 0 && (
                        <div
                          className="absolute bottom-full mb-1 left-0 z-50 bg-gray-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap shadow"
                          style={{ left: Math.max(0, bar.left) }}
                        >
                          {format(previewStart, 'dd MMM', { locale: es })} → {format(previewEnd, 'dd MMM', { locale: es })}
                          {!task.startDate && <span className="text-yellow-300 ml-1">(inicio desde hoy)</span>}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* SVG dependency arrows */}
                {showDeps && arrows.length > 0 && (
                  <svg className="absolute top-0 left-0 pointer-events-none z-30" width={svgW} height={svgH} overflow="visible">
                    <defs>
                      <marker id="arrow-normal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#6366f1" />
                      </marker>
                      <marker id="arrow-violation" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
                      </marker>
                    </defs>
                    {arrows.map((a, i) => (
                      <path key={i} d={a.path} fill="none"
                        stroke={a.isViolation ? '#ef4444' : '#6366f1'}
                        strokeWidth={1.5}
                        strokeDasharray={a.isViolation ? '4 3' : undefined}
                        markerEnd={a.isViolation ? 'url(#arrow-violation)' : 'url(#arrow-normal)'}
                        opacity={hoveredTask && (hoveredTask === a.fromId || hoveredTask === a.toId) ? 1 : 0.45}
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
            <div className={`h-2.5 w-5 rounded-sm ${cls}`} />{STATUS_LABELS[s]}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-4">
          <AlertTriangle className="h-3 w-3 text-red-400" />Vencida
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-4 w-px bg-primary/50" />Hoy
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <svg width="20" height="10"><defs><marker id="l-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#6366f1"/></marker></defs><path d="M0,5 L14,5" stroke="#6366f1" strokeWidth="1.5" markerEnd="url(#l-a)" fill="none"/></svg>
          Dependencia
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <svg width="20" height="10"><defs><marker id="l-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444"/></marker></defs><path d="M0,5 L14,5" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#l-b)" fill="none"/></svg>
          Violación
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="3" width="10" height="6" rx="1" fill="#6366f1" opacity="0.7"/></svg>
          Arrastra para mover
        </div>
      </div>
    </div>
  );
}
