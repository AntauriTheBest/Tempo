import { useEffect, useState, useCallback } from 'react';
import { Plus, Send, Pencil, Copy, Check } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import type { AdminUserListItem, UserRole } from '@todo-list-pro/shared';

const INVITE_FORM_DEFAULT = { email: '', name: '', role: 'USER' as UserRole };

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState(INVITE_FORM_DEFAULT);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [editUser, setEditUser] = useState<AdminUserListItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'USER' as UserRole, isActive: true });

  const fetchUsers = useCallback(async () => {
    try {
      const result = await adminService.getUsers();
      setUsers(result.data);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInvite = async () => {
    if (!inviteForm.email.trim() || !inviteForm.name.trim()) return;
    setInviteSubmitting(true);
    try {
      const result = await adminService.inviteUser(inviteForm);
      setInvitationUrl(window.location.origin + result.invitationUrl);
      toast.success(`Invitación enviada a ${inviteForm.email}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al invitar usuario');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleCopyUrl = async () => {
    if (invitationUrl) {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseInvite = () => {
    setShowInvite(false);
    setInviteForm(INVITE_FORM_DEFAULT);
    setInvitationUrl(null);
    setCopied(false);
  };

  const handleEdit = (user: AdminUserListItem) => {
    setEditUser(user);
    setEditForm({ name: user.name, role: user.role, isActive: user.isActive });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      await adminService.updateUser(editUser.id, editForm);
      toast.success('Usuario actualizado');
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  const handleResend = async (userId: string, email: string) => {
    try {
      const result = await adminService.resendInvitation(userId);
      const fullUrl = window.location.origin + result.invitationUrl;
      await navigator.clipboard.writeText(fullUrl);
      toast.success(`Invitación reenviada a ${email}. URL copiada al portapapeles.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al reenviar invitación');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Usuarios</h2>
        <Button onClick={() => setShowInvite(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Invitar usuario
        </Button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Rol</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}
                  >
                    {user.role === 'ADMIN' ? 'Admin' : 'Usuario'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}
                  >
                    {user.isActive ? 'Activo' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!user.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Reenviar invitación"
                        onClick={() => handleResend(user.id, user.email)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={handleCloseInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar usuario</DialogTitle>
          </DialogHeader>
          {invitationUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Usuario creado. Comparte este enlace para que establezca su contraseña:
              </p>
              <div className="flex items-center gap-2">
                <Input value={invitationUrl} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseInvite}>Cerrar</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="usuario@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="USER">Usuario</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseInvite}>
                  Cancelar
                </Button>
                <Button onClick={handleInvite} disabled={inviteSubmitting}>
                  {inviteSubmitting ? 'Invitando...' : 'Invitar'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editUser?.email || ''} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="USER">Usuario</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editForm.isActive}
                onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
