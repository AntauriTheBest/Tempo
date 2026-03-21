import { useEffect, useState } from 'react';
import { Zap, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { automationsService } from '../services/automations.service';
import { useLists } from '../hooks/useLists';
import { useUsers } from '../hooks/useUsers';
import type {
  Automation,
  AutomationTrigger,
  AutomationActionType,
  CreateAutomationRequest,
} from '@todo-list-pro/shared';
import {
  AUTOMATION_TRIGGER_LABELS,
  AUTOMATION_ACTION_LABELS,
} from '@todo-list-pro/shared';

const TRIGGERS: AutomationTrigger[] = [
  'TASK_COMPLETED',
  'TASK_CREATED',
  'STATUS_CHANGED',
  'DUE_DATE_APPROACHING',
];

const ACTIONS: AutomationActionType[] = [
  'NOTIFY_ASSIGNEES',
  'NOTIFY_USER',
  'SET_STATUS',
  'SET_ASSIGNEE',
];

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const EMPTY_FORM: CreateAutomationRequest = {
  name: '',
  trigger: 'TASK_COMPLETED',
  actionType: 'NOTIFY_ASSIGNEES',
  actionConfig: {},
};

export function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateAutomationRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { lists, fetchLists } = useLists();
  const { users, fetchUsers } = useUsers();

  useEffect(() => {
    Promise.all([fetchLists(), fetchUsers()]);
    automationsService.getAll()
      .then(setAutomations)
      .catch(() => toast.error('Error al cargar automatizaciones'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Escribe un nombre'); return; }
    setSaving(true);
    try {
      const created = await automationsService.create(form);
      setAutomations((prev) => [created, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast.success('Automatización creada');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (a: Automation) => {
    try {
      const updated = await automationsService.update(a.id, { isActive: !a.isActive });
      setAutomations((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta automatización?')) return;
    try {
      await automationsService.remove(id);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      toast.success('Eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Automatizaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define reglas que ejecutan acciones automáticamente cuando ocurren eventos en tus tareas.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1" /> Nueva regla
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-primary/40 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Nueva automatización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Notificar al completar tarea urgente"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Trigger */}
            <div>
              <label className="text-sm font-medium">Cuando…</label>
              <div className="relative mt-1">
                <select
                  value={form.trigger}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    trigger: e.target.value as AutomationTrigger,
                    triggerConfig: {},
                  }))}
                  className="w-full appearance-none rounded-md border px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {TRIGGERS.map((t) => (
                    <option key={t} value={t}>{AUTOMATION_TRIGGER_LABELS[t]}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Trigger config — filter by list */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Filtrar por lista (opcional)
              </label>
              <div className="relative mt-1">
                <select
                  value={(form.triggerConfig as any)?.listId ?? ''}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    triggerConfig: e.target.value ? { listId: e.target.value } : undefined,
                  }))}
                  className="w-full appearance-none rounded-md border px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Cualquier lista</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Action */}
            <div>
              <label className="text-sm font-medium">Entonces…</label>
              <div className="relative mt-1">
                <select
                  value={form.actionType}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    actionType: e.target.value as AutomationActionType,
                    actionConfig: {},
                  }))}
                  className="w-full appearance-none rounded-md border px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {ACTIONS.map((a) => (
                    <option key={a} value={a}>{AUTOMATION_ACTION_LABELS[a]}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Action config */}
            {form.actionType === 'SET_STATUS' && (
              <div>
                <label className="text-sm font-medium">Cambiar a estado</label>
                <div className="relative mt-1">
                  <select
                    value={(form.actionConfig as any)?.status ?? 'IN_PROGRESS'}
                    onChange={(e) => setForm((f) => ({ ...f, actionConfig: { status: e.target.value } }))}
                    className="w-full appearance-none rounded-md border px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            )}

            {(form.actionType === 'NOTIFY_USER' || form.actionType === 'SET_ASSIGNEE') && (
              <div>
                <label className="text-sm font-medium">
                  {form.actionType === 'SET_ASSIGNEE' ? 'Asignar a' : 'Notificar a'}
                </label>
                <div className="relative mt-1">
                  <select
                    value={(form.actionConfig as any)?.userId ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, actionConfig: { userId: e.target.value } }))}
                    className="w-full appearance-none rounded-md border px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">Selecciona un usuario</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? 'Guardando…' : 'Crear automatización'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : automations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center">
          <Zap className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-medium text-gray-500">Sin automatizaciones</p>
          <p className="text-sm text-gray-400 mt-1">
            Crea reglas para que las tareas se actualicen solas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((a) => (
            <Card key={a.id} className={a.isActive ? '' : 'opacity-60'}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  a.isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Zap className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium text-foreground/70">{AUTOMATION_TRIGGER_LABELS[a.trigger]}</span>
                    {' → '}
                    <span className="font-medium text-foreground/70">{AUTOMATION_ACTION_LABELS[a.actionType]}</span>
                  </p>
                  {a.createdBy && (
                    <p className="text-xs text-muted-foreground mt-1">Creada por {a.createdBy.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggle(a)}
                    className="text-gray-400 hover:text-primary transition-colors"
                    title={a.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {a.isActive
                      ? <ToggleRight className="h-5 w-5 text-primary" />
                      : <ToggleLeft className="h-5 w-5" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-gray-300 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
