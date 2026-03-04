import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { useCategoriesStore } from '../../store/categories.store';
import { useAuth } from '../../hooks/useAuth';
import { usersService, type UserSummary } from '../../services/users.service';
import type { TaskFilters as TaskFiltersType } from '@todo-list-pro/shared';

const STATUSES = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const PRIORITIES = [
  { value: '', label: 'Todas' },
  { value: 'URGENT', label: 'Urgente' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'LOW', label: 'Baja' },
];

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: Partial<TaskFiltersType>) => void;
  onClear: () => void;
  hideStatusFilter?: boolean;
}

export function TaskFilters({
  filters,
  onFiltersChange,
  onClear,
  hideStatusFilter,
}: TaskFiltersProps) {
  const categories = useCategoriesStore((s) => s.categories);
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const activeStatuses = filters.status?.split(',').filter(Boolean) || [];
  const activeUsers = filters.assignedTo?.split(',').filter(Boolean) || [];

  useEffect(() => {
    if (isAdmin) {
      usersService.getAll().then(setUsers).catch(() => {});
    }
  }, [isAdmin]);

  const toggleStatus = (status: string) => {
    const current = new Set(activeStatuses);
    if (current.has(status)) {
      current.delete(status);
    } else {
      current.add(status);
    }
    onFiltersChange({
      status: current.size > 0 ? Array.from(current).join(',') : undefined,
    });
  };

  const toggleUser = (userId: string) => {
    const current = new Set(activeUsers);
    if (current.has(userId)) {
      current.delete(userId);
    } else {
      current.add(userId);
    }
    onFiltersChange({
      assignedTo: current.size > 0 ? Array.from(current).join(',') : undefined,
    });
  };

  const hasActiveFilters =
    filters.status || filters.priority || filters.search || filters.categoryId || filters.assignedTo;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas..."
            className="pl-9"
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
          />
        </div>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.priority || ''}
          onChange={(e) =>
            onFiltersChange({
              priority: (e.target.value as any) || undefined,
            })
          }
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.categoryId || ''}
          onChange={(e) =>
            onFiltersChange({
              categoryId: e.target.value || undefined,
            })
          }
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {!hideStatusFilter && (
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <Badge
              key={s.value}
              variant={activeStatuses.includes(s.value) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                activeStatuses.includes(s.value)
                  ? ''
                  : 'hover:bg-accent'
              )}
              onClick={() => toggleStatus(s.value)}
            >
              {s.label}
            </Badge>
          ))}

          {isAdmin && users.length > 0 && (
            <>
              <div className="w-px h-5 bg-border self-center mx-1" />
              {users.map((u) => (
                <Badge
                  key={u.id}
                  variant={activeUsers.includes(u.id) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors',
                    activeUsers.includes(u.id) ? '' : 'hover:bg-accent'
                  )}
                  onClick={() => toggleUser(u.id)}
                >
                  {u.name}
                </Badge>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
