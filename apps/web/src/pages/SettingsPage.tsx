import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTagSchema } from '@todo-list-pro/shared';
import { useTags } from '../hooks/useTags';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import type { z } from 'zod';
import type { Tag } from '@todo-list-pro/shared';

type TagForm = z.infer<typeof createTagSchema>;

export function SettingsPage() {
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const { tags, fetchTags, createTag, updateTag, deleteTag } = useTags();

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const tagForm = useForm<TagForm>({
    resolver: zodResolver(createTagSchema),
    defaultValues: { color: '#8b5cf6' },
  });

  const handleTagSubmit = async (data: TagForm) => {
    if (editingTag) {
      await updateTag(editingTag.id, data);
    } else {
      await createTag(data);
    }
    setShowTagDialog(false);
    setEditingTag(null);
    tagForm.reset({ color: '#8b5cf6' });
  };

  const handleDeleteTag = async (id: string) => {
    await deleteTag(id);
  };

  const openTagDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      tagForm.reset({ name: tag.name, color: tag.color });
    } else {
      setEditingTag(null);
      tagForm.reset({ color: '#8b5cf6' });
    }
    setShowTagDialog(true);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Etiquetas</h1>
        <Button onClick={() => openTagDialog()}>
          <Plus className="mr-1 h-4 w-4" />
          Nueva etiqueta
        </Button>
      </div>

      <div className="grid gap-3">
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                <p className="font-medium">{tag.name}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openTagDialog(tag)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteTag(tag.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {tags.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No tienes etiquetas. Haz clic en "Nueva etiqueta" para crear una.
          </p>
        )}
      </div>

      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Editar etiqueta' : 'Nueva etiqueta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={tagForm.handleSubmit(handleTagSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nombre *</Label>
              <Input id="tag-name" {...tagForm.register('name')} />
              {tagForm.formState.errors.name && (
                <p className="text-xs text-destructive">{tagForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-color">Color</Label>
              <Input id="tag-color" type="color" {...tagForm.register('color')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTagDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={tagForm.formState.isSubmitting}>
                {editingTag ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
