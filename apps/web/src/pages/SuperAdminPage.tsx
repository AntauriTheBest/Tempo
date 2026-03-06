import { useEffect, useState, useCallback } from 'react';
import { superadminService, type OrgStat, type GlobalStats, type OrgDetail } from '../services/superadmin.service';
import { toast } from 'sonner';
import { Building2, Users, CheckSquare, HardDrive, RefreshCw, ChevronRight, X } from 'lucide-react';
import { Button } from '../components/ui/button';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(status: OrgStat['status']) {
  const map: Record<OrgStat['status'], string> = {
    TRIALING: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-green-100 text-green-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };
  const labels: Record<OrgStat['status'], string> = {
    TRIALING: 'Trial', ACTIVE: 'Activo', SUSPENDED: 'Suspendido', CANCELLED: 'Cancelado',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

function planBadge(plan: OrgStat['plan']) {
  const map: Record<OrgStat['plan'], string> = {
    TRIAL: 'bg-yellow-100 text-yellow-700',
    PRO: 'bg-purple-100 text-purple-700',
    ENTERPRISE: 'bg-indigo-100 text-indigo-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[plan]}`}>
      {plan}
    </span>
  );
}

// ── Org Detail Modal ──────────────────────────────────────────
function OrgModal({ org, onClose, onSave }: {
  org: OrgDetail;
  onClose: () => void;
  onSave: () => void;
}) {
  const [status, setStatus] = useState(org.status);
  const [plan, setPlan] = useState(org.plan);
  const [trialEndsAt, setTrialEndsAt] = useState(org.trialEndsAt.slice(0, 10));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await superadminService.updateOrg(org.id, { status, plan, trialEndsAt: new Date(trialEndsAt).toISOString() });
      toast.success('Organización actualizada');
      onSave();
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">{org.name}</h2>
            <p className="text-xs text-muted-foreground">/{org.slug} · creada {formatDate(org.createdAt)}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 p-4 text-center text-sm">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xl font-bold">{org.activeUsers}</p>
            <p className="text-xs text-muted-foreground">Usuarios activos</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xl font-bold">{org.taskCount}</p>
            <p className="text-xs text-muted-foreground">Tareas</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xl font-bold">{org.attachmentCount}</p>
            <p className="text-xs text-muted-foreground">Archivos</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xl font-bold">{formatBytes(org.diskUsageBytes)}</p>
            <p className="text-xs text-muted-foreground">Disco</p>
          </div>
        </div>

        {/* Edit fields */}
        <div className="grid grid-cols-3 gap-4 px-4 pb-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-md border px-3 py-1.5 text-sm"
            >
              <option value="TRIALING">Trial</option>
              <option value="ACTIVE">Activo</option>
              <option value="SUSPENDED">Suspendido</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as any)}
              className="w-full rounded-md border px-3 py-1.5 text-sm"
            >
              <option value="TRIAL">Trial</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Trial expira</label>
            <input
              type="date"
              value={trialEndsAt}
              onChange={(e) => setTrialEndsAt(e.target.value)}
              className="w-full rounded-md border px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        {org.stripeCustomerId && (
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">
            <span className="font-medium">Stripe customer:</span> {org.stripeCustomerId}
            {org.stripeSubscriptionId && (
              <> · <span className="font-medium">sub:</span> {org.stripeSubscriptionId}</>
            )}
            {org.currentPeriodEnd && (
              <> · <span className="font-medium">renovación:</span> {formatDate(org.currentPeriodEnd)}</>
            )}
          </div>
        )}

        {/* Users table */}
        <div className="border-t px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Usuarios ({org.users.length})</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {org.users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/40 text-sm">
                <div>
                  <span className="font-medium">{u.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{u.role}</span>
                  <span className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export function SuperAdminPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [orgs, setOrgs] = useState<OrgStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedOrg, setSelectedOrg] = useState<OrgDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, o] = await Promise.all([
        superadminService.getStats(),
        superadminService.listOrgs(),
      ]);
      setStats(s);
      setOrgs(o);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openOrg = async (id: string) => {
    try {
      const detail = await superadminService.getOrg(id);
      setSelectedOrg(detail);
    } catch {
      toast.error('Error al cargar organización');
    }
  };

  const filtered = filter === 'ALL' ? orgs : orgs.filter((o) => o.status === filter);

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel Superadmin</h1>
            <p className="text-sm text-muted-foreground">Vista global de todas las organizaciones</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Global stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Building2, label: 'Organizaciones', value: stats.totalOrgs, color: 'text-blue-600' },
              { icon: Users, label: 'Usuarios activos', value: stats.totalUsers, color: 'text-green-600' },
              { icon: CheckSquare, label: 'Tareas', value: stats.totalTasks, color: 'text-purple-600' },
              { icon: HardDrive, label: 'Disco total', value: formatBytes(stats.diskUsageBytes), color: 'text-orange-600' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
                <Icon className={`mb-2 h-5 w-5 ${color}`} />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {['ALL', 'TRIALING', 'ACTIVE', 'SUSPENDED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white text-muted-foreground hover:bg-muted'
              }`}
            >
              {s === 'ALL' ? 'Todos' : s === 'TRIALING' ? 'Trial' : s === 'ACTIVE' ? 'Activos' : s === 'SUSPENDED' ? 'Suspendidos' : 'Cancelados'}
              {' '}({s === 'ALL' ? orgs.length : orgs.filter((o) => o.status === s).length})
            </button>
          ))}
        </div>

        {/* Orgs table */}
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organización</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Usuarios</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Tareas</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Disco</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Trial expira</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Creada</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Sin resultados</td></tr>
              ) : filtered.map((org) => (
                <tr key={org.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => openOrg(org.id)}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">/{org.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-center">{planBadge(org.plan)}</td>
                  <td className="px-4 py-3 text-center">{statusBadge(org.status)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium">{org.activeUsers}</span>
                    <span className="text-muted-foreground">/{org.totalUsers}</span>
                  </td>
                  <td className="px-4 py-3 text-center">{org.taskCount}</td>
                  <td className="px-4 py-3 text-center">{formatBytes(org.diskUsageBytes)}</td>
                  <td className="px-4 py-3 text-center text-xs">{formatDate(org.trialEndsAt)}</td>
                  <td className="px-4 py-3 text-center text-xs">{formatDate(org.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrg && (
        <OrgModal
          org={selectedOrg}
          onClose={() => setSelectedOrg(null)}
          onSave={() => { setSelectedOrg(null); load(); }}
        />
      )}
    </div>
  );
}
