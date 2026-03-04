import { NavLink, Outlet } from 'react-router-dom';
import { Users, Building2, Tag, ArrowLeft, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const adminTabs = [
  { to: '/admin/users', label: 'Usuarios', icon: Users },
  { to: '/admin/clients', label: 'Clientes', icon: Building2 },
  { to: '/admin/categories', label: 'Categorías', icon: Tag },
  { to: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

export function AdminLayout() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NavLink
              to="/dashboard"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </NavLink>
            <h1 className="text-lg font-semibold">Panel de Administración</h1>
          </div>
        </div>
        <nav className="mt-3 flex gap-1">
          {adminTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
