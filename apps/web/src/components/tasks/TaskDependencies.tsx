import { useEffect, useState } from 'react';
import { Link2, X, Plus, AlertCircle, CheckCircle2, Clock, CircleDot } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { dependenciesService } from '../../services/dependencies.service';
import { tasksService } from '../../services/tasks.service';
import type { TaskDependencies, TaskDependencyRef, Task } from '@todo-list-pro/shared';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  IN_PROGRESS: <CircleDot className="h-3.5 w-3.5 text-blue-500" />,
  PENDING: <Clock className="h-3.5 w-3.5 text-gray-400" />,
  CANCELLED: <X className="h-3.5 w-3.5 text-red-400" />,
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completada',
  IN_PROGRESS: 'En progreso',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelada',
};

interface Props {
  taskId: string;
}

export function TaskDependencies({ taskId }: Props) {
  const [deps, setDeps] = useState<TaskDependencies>({ blockedBy: [], blocking: [] });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    dependenciesService.get(taskId)
      .then(setDeps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await tasksService.getAll({ search: search.trim(), limit: 8 });
        setSearchResults(res.data.filter((t) => t.id !== taskId));
      } catch {
        //
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, taskId]);

  const handleAdd = async (dependsOnId: string, dependsOnTitle: string) => {
    try {
      await dependenciesService.add(taskId, dependsOnId);
      const dep = searchResults.find((t) => t.id === dependsOnId);
      if (dep) {
        setDeps((prev) => ({
          ...prev,
          blockedBy: [
            ...prev.blockedBy,
            { id: dep.id, title: dep.title, status: dep.status, priority: dep.priority, dueDate: dep.dueDate },
          ],
        }));
      }
      setAdding(false);
      setSearch('');
      setSearchResults([]);
      toast.success(`Dependencia añadida: "${dependsOnTitle}"`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al añadir dependencia');
    }
  };

  const handleRemove = async (dependsOnId: string) => {
    try {
      await dependenciesService.remove(taskId, dependsOnId);
      setDeps((prev) => ({ ...prev, blockedBy: prev.blockedBy.filter((d) => d.id !== dependsOnId) }));
      toast.success('Dependencia eliminada');
    } catch {
      toast.error('Error al eliminar dependencia');
    }
  };

  if (loading) return null;

  const blockerCount = deps.blockedBy.filter((d) => d.status !== 'COMPLETED').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Link2 className="h-4 w-4" />
          Dependencias
          {blockerCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              <AlertCircle className="h-3 w-3" />
              {blockerCount} bloqueando
            </span>
          )}
        </div>
        {!adding && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)} className="h-6 px-2 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Añadir
          </Button>
        )}
      </div>

      {/* Search to add */}
      {adding && (
        <div className="relative">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tarea…"
            className="w-full rounded-md border bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={() => { setAdding(false); setSearch(''); setSearchResults([]); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {(searchResults.length > 0 || searching) && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
              {searching && (
                <p className="px-3 py-2 text-xs text-gray-400">Buscando…</p>
              )}
              {searchResults.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleAdd(t.id, t.title)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                >
                  {STATUS_ICONS[t.status]}
                  <span className="flex-1 truncate">{t.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blocked by */}
      {deps.blockedBy.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bloqueada por</p>
          {deps.blockedBy.map((d) => (
            <DependencyRow
              key={d.id}
              dep={d}
              onRemove={() => handleRemove(d.id)}
            />
          ))}
        </div>
      )}

      {/* Blocking */}
      {deps.blocking.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bloquea a</p>
          {deps.blocking.map((d) => (
            <DependencyRow key={d.id} dep={d} readonly />
          ))}
        </div>
      )}

      {deps.blockedBy.length === 0 && deps.blocking.length === 0 && !adding && (
        <p className="text-xs text-gray-400">Sin dependencias</p>
      )}
    </div>
  );
}

function DependencyRow({
  dep,
  onRemove,
  readonly,
}: {
  dep: TaskDependencyRef;
  onRemove?: () => void;
  readonly?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
      dep.status !== 'COMPLETED' && !readonly ? 'border-amber-200 bg-amber-50' : 'bg-gray-50'
    }`}>
      {STATUS_ICONS[dep.status] ?? <Clock className="h-3.5 w-3.5 text-gray-400" />}
      <span className="flex-1 truncate">{dep.title}</span>
      <span className="text-xs text-gray-400">{STATUS_LABELS[dep.status] ?? dep.status}</span>
      {!readonly && onRemove && (
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
