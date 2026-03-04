import { useState, useEffect } from 'react';
import { apiClient } from '../services/api-client';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import type { Organization } from '@todo-list-pro/shared';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export function OrgSettingsPage() {
  const { user, organization: storeOrg, isAdmin } = useAuth();
  const [org, setOrg] = useState<Organization | null>(storeOrg);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ email: '', name: '', role: 'MEMBER' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [orgRes, membersRes] = await Promise.all([
          apiClient.get('/org'),
          apiClient.get('/org/members'),
        ]);
        setOrg(orgRes.data.data);
        setNameValue(orgRes.data.data.name);
        setMembers(membersRes.data.data);
      } catch {
        toast.error('Error al cargar los datos de la organización');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSavingName(true);
    try {
      const res = await apiClient.put('/org', { name: nameValue.trim() });
      setOrg(res.data.data);
      setEditingName(false);
      toast.success('Nombre actualizado');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setSavingName(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('¿Eliminar este miembro de la organización?')) return;
    try {
      await apiClient.delete(`/org/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success('Miembro eliminado');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar miembro');
    }
  };

  const handleInvite = async () => {
    if (!invite.email.trim() || !invite.name.trim()) {
      toast.error('Email y nombre son requeridos');
      return;
    }
    setInviting(true);
    try {
      const res = await apiClient.post('/org/members/invite', invite);
      setMembers((prev) => [...prev, res.data.data]);
      setInvite({ email: '', name: '', role: 'MEMBER' });
      setShowInvite(false);
      toast.success('Invitación enviada');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al invitar miembro');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mi organización</h1>

      {/* Org name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nombre de la organización</CardTitle>
        </CardHeader>
        <CardContent>
          {editingName ? (
            <div className="flex gap-2">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="flex-1"
              />
              <Button onClick={handleSaveName} disabled={savingName}>
                {savingName ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="outline" onClick={() => { setEditingName(false); setNameValue(org?.name ?? ''); }}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">{org?.name}</span>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setEditingName(true)}>
                  Editar
                </Button>
              )}
            </div>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Slug: {org?.slug}</p>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Miembros</CardTitle>
            {isAdmin && (
              <Button size="sm" onClick={() => setShowInvite(!showInvite)}>
                {showInvite ? 'Cancelar' : 'Invitar miembro'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showInvite && (
            <div className="rounded-md border p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-medium">Invitar nuevo miembro</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="invite-name">Nombre</Label>
                  <Input
                    id="invite-name"
                    placeholder="Nombre completo"
                    value={invite.name}
                    onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={invite.email}
                    onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="invite-role">Rol</Label>
                <select
                  id="invite-role"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={invite.role}
                  onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="MEMBER">Miembro</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <Button onClick={handleInvite} disabled={inviting} size="sm">
                {inviting ? 'Enviando...' : 'Enviar invitación'}
              </Button>
            </div>
          )}

          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay miembros.</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {member.role === 'ADMIN' ? 'Admin' : 'Miembro'}
                </span>
                {isAdmin && member.id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-7 px-2"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
