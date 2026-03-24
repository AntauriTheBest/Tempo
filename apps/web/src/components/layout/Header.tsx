import {
  LogOut, User, Moon, Sun,
  CalendarCheck, BarChart3, Shield, Building2, CreditCard, Tag, ServerCog, Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';

export function Header({ title }: { title?: string }) {
  const { user, logout, isAdmin } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {initials || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm hidden sm:inline">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user?.email}</div>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Tag className="mr-2 h-4 w-4" />
              Etiquetas
            </DropdownMenuItem>

            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-xs text-muted-foreground">Administración</div>
                <DropdownMenuItem onClick={() => navigate('/admin/monthly')}>
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Igualas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/reports')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reportes globales
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Administración
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/org/settings')}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Mi organización
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/billing')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Facturación
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/automations')}>
                  <Zap className="mr-2 h-4 w-4" />
                  Automatizaciones
                </DropdownMenuItem>
              </>
            )}

            {(user as any)?.isSuperAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/superadmin')}>
                  <ServerCog className="mr-2 h-4 w-4" />
                  Superadmin
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
