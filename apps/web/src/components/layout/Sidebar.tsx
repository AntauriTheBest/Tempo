import { useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  User,
  Plus,
  ChevronDown,
  Building2,
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  UserCheck,
  Users,
  GitFork,
  GanttChartSquare,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';
import { useLists } from '../../hooks/useLists';
import { useCategories } from '../../hooks/useCategories';
import { useTags } from '../../hooks/useTags';
import { useClients } from '../../hooks/useClients';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';

const ICON_MAP: Record<string, React.ReactNode> = {};

function NavItem({
  to,
  icon,
  label,
  count,
  color,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  color?: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )
      }
    >
      {color ? (
        <span
          className="h-4 w-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      ) : (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </NavLink>
  );
}

function DroppableNavItem({
  listId,
  ...navProps
}: {
  listId: string;
  to: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  color?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `sidebar-${listId}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-md transition-all',
        isOver && 'ring-2 ring-primary bg-primary/10'
      )}
    >
      <NavItem {...navProps} />
    </div>
  );
}

export function Sidebar() {
  const { lists, fetchLists } = useLists();
  const { fetchCategories } = useCategories();
  const { fetchTags } = useTags();
  const { clients, fetchClients } = useClients();
  const { isAdmin, user } = useAuth();
  const organization = useAuthStore((s) => s.organization);
  const navigate = useNavigate();

  const trialDaysLeft = organization?.status === 'TRIALING'
    ? Math.max(0, Math.ceil((new Date(organization.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  useEffect(() => {
    fetchLists();
    fetchCategories();
    fetchTags();
    fetchClients();
  }, [fetchLists, fetchCategories, fetchTags, fetchClients]);

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="p-4">
        <h1 className="text-lg font-bold text-primary">Tempo</h1>
      </div>

      {/* Trial expiry banner */}
      {trialDaysLeft !== null && trialDaysLeft <= 7 && (
        <Link
          to="/billing"
          className={`mx-3 mb-1 rounded-md px-3 py-2 text-xs font-medium block transition-opacity hover:opacity-80 ${
            trialDaysLeft === 0
              ? 'bg-destructive/15 text-destructive'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {trialDaysLeft === 0
            ? '⚠ Trial expirado — Actualizar plan'
            : `⏳ Trial expira en ${trialDaysLeft} día${trialDaysLeft === 1 ? '' : 's'} — Actualizar`}
        </Link>
      )}

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {/* Dashboard (admin only) */}
        {isAdmin && (
          <NavItem
            to="/dashboard"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Dashboard"
          />
        )}

        {/* Main navigation */}
        <NavItem
          to="/my-tasks"
          icon={<User className="h-4 w-4" />}
          label="Mis tareas"
        />
        <NavItem
          to="/assigned"
          icon={<UserCheck className="h-4 w-4" />}
          label="Asignadas a mí"
        />
        <NavItem
          to="/reports"
          icon={<BarChart3 className="h-4 w-4" />}
          label="Reportes"
        />
        <NavItem
          to="/calendar"
          icon={<CalendarDays className="h-4 w-4" />}
          label="Calendario"
        />
        <NavItem
          to="/team"
          icon={<Users className="h-4 w-4" />}
          label="Equipo"
        />
        <NavItem
          to="/graph"
          icon={<GitFork className="h-4 w-4" />}
          label="Grafo de dependencias"
        />
        <NavItem
          to="/gantt"
          icon={<GanttChartSquare className="h-4 w-4" />}
          label="Gantt"
        />

        {/* Lists section */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Listas
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => navigate('/my-tasks?manage=lists')}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {lists
            .filter((l) => !['Inbox', 'Hoy', 'Próximos'].includes(l.name))
            .map((list) => (
              <DroppableNavItem
                key={list.id}
                listId={list.id}
                to={`/lists/${list.id}`}
                icon={ICON_MAP[list.icon || ''] || <ChevronDown className="h-4 w-4" />}
                label={list.name}
                color={list.color}
                count={(list as any)._count?.tasks}
              />
            ))}
        </div>

        {/* Clients section */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Clientes
            </span>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => navigate('/admin/clients')}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
          {clients.map((client) => (
            <NavItem
              key={client.id}
              to={`/clients/${client.id}`}
              icon={<Building2 className="h-4 w-4" />}
              label={client.name}
              color={client.color}
              count={(client as any)._count?.lists}
            />
          ))}
        </div>
      </nav>

    </aside>
  );
}
