import { useCallback } from 'react';
import { useTagsStore } from '../store/tags.store';
import { tagsService } from '../services/tags.service';
import type {
  CreateTagRequest,
  UpdateTagRequest,
} from '@todo-list-pro/shared';
import { toast } from 'sonner';

export function useTags() {
  const tags = useTagsStore((s) => s.tags);
  const isLoading = useTagsStore((s) => s.isLoading);
  const setTags = useTagsStore((s) => s.setTags);
  const setLoading = useTagsStore((s) => s.setLoading);
  const addTag = useTagsStore((s) => s.addTag);
  const updateTagStore = useTagsStore((s) => s.updateTag);
  const removeTag = useTagsStore((s) => s.removeTag);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const result = await tagsService.getAll();
      setTags(result.data);
    } catch {
      toast.error('Error loading tags');
    } finally {
      setLoading(false);
    }
  }, [setTags, setLoading]);

  const createTag = useCallback(
    async (data: CreateTagRequest) => {
      try {
        const tag = await tagsService.create(data);
        addTag(tag);
        toast.success('Etiqueta creada');
        return tag;
      } catch {
        toast.error('Error al crear etiqueta');
      }
    },
    [addTag]
  );

  const updateTag = useCallback(
    async (id: string, data: UpdateTagRequest) => {
      try {
        const tag = await tagsService.update(id, data);
        updateTagStore(tag);
        toast.success('Etiqueta actualizada');
        return tag;
      } catch {
        toast.error('Error al actualizar etiqueta');
      }
    },
    [updateTagStore]
  );

  const deleteTag = useCallback(
    async (id: string) => {
      try {
        await tagsService.remove(id);
        removeTag(id);
        toast.success('Etiqueta eliminada');
      } catch {
        toast.error('Error al eliminar etiqueta');
      }
    },
    [removeTag]
  );

  return {
    tags,
    isLoading,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
  };
}
