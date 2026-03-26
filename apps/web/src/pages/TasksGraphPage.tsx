import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { apiClient } from '../services/api-client';
import { dependenciesService } from '../services/dependencies.service';
import { toast } from 'sonner';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Info, Link2, X } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  list?: { id: string; name: string; color: string } | null;
  assignees: { id: string; name: string }[];
  x: number;
  y: number;
  col: number;
  row: number;
}

interface GraphEdge {
  taskId: string;       // blocked task (needs dependsOn to finish first)
  dependsOnId: string;  // must complete first
}

// ── Constants ────────────────────────────────────────────────────────────────

const NODE_W = 200;
const NODE_H = 60;
const COL_GAP = 280;
const ROW_GAP = 90;
const PAD = 60;

const STATUS_COLORS_LIGHT: Record<string, { fill: string; stroke: string; text: string }> = {
  PENDING:     { fill: '#f1f5f9', stroke: '#94a3b8', text: '#475569' },
  IN_PROGRESS: { fill: '#dbeafe', stroke: '#3b82f6', text: '#1d4ed8' },
  COMPLETED:   { fill: '#dcfce7', stroke: '#22c55e', text: '#15803d' },
  CANCELLED:   { fill: '#fee2e2', stroke: '#ef4444', text: '#b91c1c' },
};

const STATUS_COLORS_DARK: Record<string, { fill: string; stroke: string; text: string }> = {
  PENDING:     { fill: '#1e293b', stroke: '#64748b', text: '#94a3b8' },
  IN_PROGRESS: { fill: '#1e3a5f', stroke: '#3b82f6', text: '#93c5fd' },
  COMPLETED:   { fill: '#14532d', stroke: '#22c55e', text: '#86efac' },
  CANCELLED:   { fill: '#450a0a', stroke: '#ef4444', text: '#fca5a5' },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
};

// ── Layout ───────────────────────────────────────────────────────────────────

function computeLayout(rawNodes: Omit<GraphNode, 'x' | 'y' | 'col' | 'row'>[], edges: GraphEdge[]) {
  const nodeMap = new Map(rawNodes.map((n) => [n.id, { ...n, x: 0, y: 0, col: 0, row: 0 }]));

  const outEdges = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const n of rawNodes) { outEdges.set(n.id, []); inDegree.set(n.id, 0); }
  for (const e of edges) {
    outEdges.get(e.dependsOnId)?.push(e.taskId);
    inDegree.set(e.taskId, (inDegree.get(e.taskId) ?? 0) + 1);
  }

  const col = new Map<string, number>();
  const queue: string[] = [];
  for (const [id, deg] of inDegree) { if (deg === 0) { col.set(id, 0); queue.push(id); } }
  for (const n of rawNodes) { if (!col.has(n.id)) { col.set(n.id, 0); queue.push(n.id); } }

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curCol = col.get(cur) ?? 0;
    for (const next of (outEdges.get(cur) ?? [])) {
      const newCol = curCol + 1;
      if ((col.get(next) ?? 0) < newCol) { col.set(next, newCol); queue.push(next); }
    }
  }

  const byCols = new Map<number, string[]>();
  for (const [id, c] of col) { if (!byCols.has(c)) byCols.set(c, []); byCols.get(c)!.push(id); }

  for (const [c, ids] of byCols) {
    ids.forEach((id, row) => {
      const node = nodeMap.get(id)!;
      node.col = c; node.row = row;
      node.x = PAD + c * COL_GAP;
      node.y = PAD + row * ROW_GAP;
    });
  }

  return { nodes: Array.from(nodeMap.values()), cols: byCols.size };
}

function edgePath(from: GraphNode, to: GraphNode) {
  const x1 = from.x + NODE_W, y1 = from.y + NODE_H / 2;
  const x2 = to.x,            y2 = to.y + NODE_H / 2;
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

function tempEdgePath(x1: number, y1: number, x2: number, y2: number) {
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

// ── Dark mode hook ────────────────────────────────────────────────────────────

function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TasksGraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  // Connect mode
  const [connectMode, setConnectMode] = useState(false);
  const [connectSource, setConnectSource] = useState<GraphNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // SVG coords
  const [connectingEdge, setConnectingEdge] = useState(false);

  const isDark = useIsDark();
  const STATUS_COLORS = useMemo(
    () => isDark ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT,
    [isDark]
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });


  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/tasks/graph');
      const { nodes: rawNodes, edges: rawEdges } = res.data.data;
      const { nodes: laid } = computeLayout(rawNodes, rawEdges);
      setNodes(laid);
      setEdges(rawEdges);
    } catch {
      toast.error('Error al cargar el grafo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  // ESC exits connect mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setConnectMode(false); setConnectSource(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Convert client coords to SVG canvas coords
  const toSVGCoords = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - transform.x) / transform.scale,
      y: (clientY - rect.top  - transform.y) / transform.scale,
    };
  };

  // Pan & zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({ ...t, scale: Math.min(3, Math.max(0.2, t.scale * factor)) }));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (connectMode) return;
    if ((e.target as Element).closest('[data-node]')) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (connectMode && connectSource) {
      setMousePos(toSVGCoords(e.clientX, e.clientY));
    }
    if (!isPanning.current) return;
    setTransform((t) => ({
      ...t,
      x: panStart.current.tx + (e.clientX - panStart.current.x),
      y: panStart.current.ty + (e.clientY - panStart.current.y),
    }));
  };

  const onMouseUp = () => { isPanning.current = false; };

  // Node click handler
  const handleNodeClick = async (node: GraphNode) => {
    if (!connectMode) {
      setSelected((prev) => prev?.id === node.id ? null : node);
      return;
    }

    // Connect mode
    if (!connectSource) {
      // First click: select source
      setConnectSource(node);
      setMousePos({ x: node.x + NODE_W, y: node.y + NODE_H / 2 });
      return;
    }

    if (connectSource.id === node.id) {
      // Click same node: deselect
      setConnectSource(null);
      return;
    }

    // Second click: create dependency (source must complete before node)
    setConnectingEdge(true);
    try {
      await dependenciesService.add(node.id, connectSource.id);
      const newEdge: GraphEdge = { taskId: node.id, dependsOnId: connectSource.id };
      const newEdges = [...edges, newEdge];
      const { nodes: relaid } = computeLayout(nodes, newEdges);
      setNodes(relaid);
      setEdges(newEdges);
      toast.success(`Dependencia creada: "${connectSource.title}" → "${node.title}"`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear dependencia');
    } finally {
      setConnectingEdge(false);
      setConnectSource(null);
    }
  };

  // Delete edge on click
  const handleEdgeClick = async (e: React.MouseEvent, edge: GraphEdge) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar esta dependencia?`)) return;
    try {
      await dependenciesService.remove(edge.taskId, edge.dependsOnId);
      const newEdges = edges.filter((ed) => !(ed.taskId === edge.taskId && ed.dependsOnId === edge.dependsOnId));
      const { nodes: relaid } = computeLayout(nodes, newEdges);
      setNodes(relaid);
      setEdges(newEdges);
      toast.success('Dependencia eliminada');
    } catch {
      toast.error('Error al eliminar dependencia');
    }
  };

  const zoomIn  = () => setTransform((t) => ({ ...t, scale: Math.min(3, t.scale * 1.2) }));
  const zoomOut = () => setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale / 1.2) }));
  const fitView = () => setTransform({ x: 0, y: 0, scale: 1 });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">Grafo de dependencias</h1>
          {!loading && (
            <span className="text-xs text-muted-foreground">
              {nodes.length} tareas · {edges.length} dependencias
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Connect mode toggle */}
          <button
            onClick={() => { setConnectMode((v) => !v); setConnectSource(null); setSelected(null); }}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              connectMode
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'hover:bg-accent text-muted-foreground'
            }`}
            title="Modo conectar: haz click en un nodo origen, luego en el destino"
          >
            <Link2 className="h-3.5 w-3.5" />
            {connectMode ? (connectSource ? 'Elige destino…' : 'Elige origen…') : 'Conectar'}
          </button>

          {connectMode && (
            <button
              onClick={() => { setConnectMode(false); setConnectSource(null); }}
              className="rounded-md border px-2 py-1.5 text-xs hover:bg-accent transition-colors"
              title="Cancelar (ESC)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-border mx-1" />
          <button onClick={fetchGraph} className="rounded p-1.5 hover:bg-accent transition-colors" title="Recargar">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={zoomIn}  className="rounded p-1.5 hover:bg-accent transition-colors"><ZoomIn  className="h-4 w-4" /></button>
          <button onClick={zoomOut} className="rounded p-1.5 hover:bg-accent transition-colors"><ZoomOut className="h-4 w-4" /></button>
          <button onClick={fitView} className="rounded p-1.5 hover:bg-accent transition-colors" title="Ajustar vista"><Maximize2 className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Hint bar when in connect mode */}
      {connectMode && (
        <div className={`flex items-center gap-2 px-4 py-1.5 text-xs border-b transition-colors ${
          connectSource
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        }`}>
          <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
          {connectSource
            ? <>Origen: <strong>"{connectSource.title}"</strong>. Ahora haz click en la tarea que quedará bloqueada. <kbd className="rounded bg-background/60 px-1 border">ESC</kbd> para cancelar.</>
            : <>Haz click en la tarea que debe completarse <strong>primero</strong> (origen). <kbd className="rounded bg-background/60 px-1 border">ESC</kbd> para salir.</>
          }
        </div>
      )}

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden bg-muted/30">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Info className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">Sin tareas disponibles</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Crea tareas y añade dependencias para visualizarlas aquí.</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className={`w-full h-full select-none ${
              connectMode
                ? connectSource ? 'cursor-crosshair' : 'cursor-cell'
                : 'cursor-grab active:cursor-grabbing'
            }`}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <defs>
              <marker id="arrow"      markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
              </marker>
              <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
              </marker>
              <marker id="arrow-temp" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#f59e0b" />
              </marker>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill={isDark ? '#334155' : '#e2e8f0'} />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#dots)" />

            <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>

              {/* Existing edges */}
              {edges.map((e) => {
                const from = nodeMap.get(e.dependsOnId);
                const to   = nodeMap.get(e.taskId);
                if (!from || !to) return null;
                const isHighlighted = !connectMode && (selected?.id === from.id || selected?.id === to.id);
                const midX = (from.x + NODE_W + to.x) / 2;
                const midY = (from.y + to.y) / 2 + NODE_H / 2;

                return (
                  <g key={`${e.dependsOnId}-${e.taskId}`}>
                    {/* Clickable wider invisible path */}
                    <path
                      d={edgePath(from, to)}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={12}
                      className="cursor-pointer"
                      onClick={(ev) => handleEdgeClick(ev, e)}
                    />
                    <path
                      d={edgePath(from, to)}
                      fill="none"
                      stroke={isHighlighted ? '#3b82f6' : '#94a3b8'}
                      strokeWidth={isHighlighted ? 2 : 1.5}
                      strokeDasharray={to.status === 'COMPLETED' ? '4 3' : undefined}
                      markerEnd={isHighlighted ? 'url(#arrow-blue)' : 'url(#arrow)'}
                      opacity={selected && !isHighlighted && !connectMode ? 0.25 : 1}
                      className="pointer-events-none"
                    />
                    {/* Delete button on hover — shown via group hover */}
                    <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                      <circle cx={midX} cy={midY} r={8} fill={isDark ? '#1e293b' : 'white'} stroke="#ef4444" strokeWidth={1.5} />
                      <text x={midX} y={midY} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#ef4444">✕</text>
                    </g>
                  </g>
                );
              })}

              {/* Temporary edge while connecting */}
              {connectMode && connectSource && (
                <path
                  d={tempEdgePath(
                    connectSource.x + NODE_W,
                    connectSource.y + NODE_H / 2,
                    mousePos.x,
                    mousePos.y,
                  )}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  markerEnd="url(#arrow-temp)"
                  className="pointer-events-none"
                />
              )}

              {/* Nodes */}
              {nodes.map((node) => {
                const colors = STATUS_COLORS[node.status] ?? STATUS_COLORS.PENDING;
                const isSelected  = selected?.id === node.id;
                const isSource    = connectSource?.id === node.id;
                const alreadyLinked = connectSource
                  ? edges.some((e) => (e.taskId === node.id && e.dependsOnId === connectSource.id) ||
                                      (e.dependsOnId === node.id && e.taskId === connectSource.id))
                  : false;

                const isConnectedToSelected = selected
                  ? edges.some((e) => (e.taskId === node.id && e.dependsOnId === selected.id) ||
                                      (e.dependsOnId === node.id && e.taskId === selected.id) ||
                                      node.id === selected.id)
                  : true;

                const dimmed = (selected && !connectMode && !isConnectedToSelected) ||
                               (connectMode && connectSource && (isSource || alreadyLinked));

                return (
                  <g
                    key={node.id}
                    data-node="true"
                    transform={`translate(${node.x},${node.y})`}
                    opacity={dimmed ? 0.3 : 1}
                    onClick={() => !connectingEdge && handleNodeClick(node)}
                    className="cursor-pointer"
                  >
                    {/* Node body */}
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx={8}
                      fill={colors.fill}
                      stroke={
                        isSource  ? '#f59e0b' :
                        isSelected ? '#2563eb' :
                        connectMode && connectSource && !alreadyLinked && !isSource ? '#10b981' :
                        colors.stroke
                      }
                      strokeWidth={isSource || isSelected ? 2.5 : 1.5}
                      strokeDasharray={connectMode && connectSource && !alreadyLinked && !isSource ? '4 3' : undefined}
                      filter={isSource ? 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' :
                              isSelected ? 'drop-shadow(0 2px 8px rgba(37,99,235,0.3))' : undefined}
                    />

                    {/* List color dot */}
                    {node.list && <circle cx={14} cy={NODE_H / 2} r={5} fill={node.list.color} />}

                    {/* Title */}
                    <text
                      x={node.list ? 26 : 12} y={NODE_H / 2 - 7}
                      fontSize={12} fontWeight={600} fill={colors.text} dominantBaseline="middle"
                    >
                      <title>{node.title}</title>
                      {node.title.length > 22 ? node.title.slice(0, 22) + '…' : node.title}
                    </text>

                    {/* Status + date */}
                    <text
                      x={node.list ? 26 : 12} y={NODE_H / 2 + 10}
                      fontSize={10} fill={colors.text} opacity={0.75} dominantBaseline="middle"
                    >
                      {STATUS_LABELS[node.status]}
                      {node.dueDate && ` · ${new Date(node.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                    </text>

                    {/* Connect handle on right edge (visible in connect mode) */}
                    {connectMode && !isSource && (
                      <g opacity={0.7}>
                        <circle cx={NODE_W + 10} cy={NODE_H / 2} r={7} fill={alreadyLinked ? '#94a3b8' : '#10b981'} />
                        <text x={NODE_W + 10} y={NODE_H / 2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="white" fontWeight="bold">
                          {alreadyLinked ? '✓' : '+'}
                        </text>
                      </g>
                    )}

                    {/* Source indicator */}
                    {isSource && (
                      <text x={NODE_W / 2} y={-10} textAnchor="middle" fontSize={9} fill="#f59e0b" fontWeight="600">
                        ORIGEN
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Info panel for selected node (non-connect mode) */}
        {selected && !connectMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl border bg-card shadow-lg px-4 py-3 text-sm max-w-sm w-full">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate">{selected.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {STATUS_LABELS[selected.status]}
                  {selected.list && ` · ${selected.list.name}`}
                  {selected.dueDate && ` · Vence ${new Date(selected.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bloqueada por: <strong>{edges.filter((e) => e.taskId === selected.id).length}</strong>
                  {' · '}
                  Bloquea a: <strong>{edges.filter((e) => e.dependsOnId === selected.id).length}</strong>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setConnectSource(selected); setConnectMode(true); setSelected(null); }}
                  className="rounded p-1 text-primary hover:bg-primary/10 transition-colors"
                  title="Crear dependencia desde esta tarea"
                >
                  <Link2 className="h-4 w-4" />
                </button>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions panel */}
        {!connectMode && edges.length > 0 && !selected && (
          <div className="absolute bottom-4 right-4 rounded-lg bg-card/90 border px-3 py-2 text-xs text-muted-foreground space-y-0.5">
            <p>• Click en nodo → detalles</p>
            <p>• Click en arista → eliminar dependencia</p>
            <p>• <strong>Conectar</strong> → crear dependencia</p>
            <p>• Scroll → zoom · Drag → mover</p>
          </div>
        )}

        {/* Zoom indicator */}
        <div className="absolute top-3 right-3 rounded-md bg-card/80 border px-2 py-1 text-xs text-muted-foreground">
          {Math.round(transform.scale * 100)}%
        </div>
      </div>
    </div>
  );
}
