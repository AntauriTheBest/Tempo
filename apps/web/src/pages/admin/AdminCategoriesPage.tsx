import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
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

export function AdminCategoriesPage() {
  const {
    categories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#6366f1', icon: '' });

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    if (editId) {
      await updateCategory(editId, formData);
    } else {
      await createCategory(formData);
    }
    setShowForm(false);
    setEditId(null);
    setFormData({ name: '', color: '#6366f1', icon: '' });
  };

  const handleEdit = (cat: (typeof categories)[0]) => {
    setEditId(cat.id);
    setFormData({ name: cat.name, color: cat.color, icon: cat.icon || '' });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Categorías</h2>
        <Button onClick={() => { setEditId(null); setFormData({ name: '', color: '#6366f1', icon: '' }); setShowForm(true); }}>
          <Plus className="mr-1 h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <div>
                <p className="font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(cat as any)._count?.tasks ?? 0} tareas
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(cat)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setDeleteId(cat.id)}
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
              {editId ? 'Editar categoría' : 'Nueva categoría'}
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
                placeholder="Nombre de la categoría"
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
              <Label>Icono (nombre lucide)</Label>
              <Input
                value={formData.icon}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, icon: e.target.value }))
                }
                placeholder="user, briefcase, home..."
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
        title="Eliminar categoría"
        description="¿Estás seguro? Las tareas de esta categoría quedarán sin categoría."
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (deleteId) deleteCategory(deleteId);
        }}
      />
    </div>
  );
}
