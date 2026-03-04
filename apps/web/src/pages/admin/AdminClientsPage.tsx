import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
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
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

const DEFAULT_FORM = {
  name: '',
  color: '#10b981',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
};

export function AdminClientsPage() {
  const {
    clients,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  } = useClients();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    if (editId) {
      await updateClient(editId, formData);
    } else {
      await createClient(formData);
    }
    setShowForm(false);
    setEditId(null);
    setFormData(DEFAULT_FORM);
  };

  const handleEdit = (client: (typeof clients)[0]) => {
    setEditId(client.id);
    setFormData({
      name: client.name,
      color: client.color,
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Clientes</h2>
        <Button
          onClick={() => {
            setEditId(null);
            setFormData(DEFAULT_FORM);
            setShowForm(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          Nuevo cliente
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <div
            key={client.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: client.color }}
              />
              <div>
                <p className="font-medium">{client.name}</p>
                {client.contactName && (
                  <p className="text-xs text-muted-foreground">
                    {client.contactName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {(client as any)._count?.lists ?? 0} listas
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(client)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setDeleteId(client.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Editar cliente' : 'Nuevo cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, color: e.target.value }))
                  }
                  className="h-10 w-10 rounded border cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, color: e.target.value }))
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre de contacto</Label>
              <Input
                value={formData.contactName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, contactName: e.target.value }))
                }
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="space-y-2">
              <Label>Email de contacto</Label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, contactEmail: e.target.value }))
                }
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono de contacto</Label>
              <Input
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, contactPhone: e.target.value }))
                }
                placeholder="+52 123 456 7890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editId ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar cliente"
        description="¿Estás seguro? Las listas asociadas a este cliente perderán la asignación."
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (deleteId) deleteClient(deleteId);
        }}
      />
    </div>
  );
}
