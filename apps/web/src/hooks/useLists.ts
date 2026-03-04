import { useCallback } from 'react';
import { useListsStore } from '../store/lists.store';
import { listsService } from '../services/lists.service';
import type { CreateListRequest, UpdateListRequest } from '@todo-list-pro/shared';
import { toast } from 'sonner';

export function useLists() {
  const lists = useListsStore((s) => s.lists);
  const isLoading = useListsStore((s) => s.isLoading);
  const setLists = useListsStore((s) => s.setLists);
  const setLoading = useListsStore((s) => s.setLoading);
  const addList = useListsStore((s) => s.addList);
  const updateListStore = useListsStore((s) => s.updateList);
  const removeList = useListsStore((s) => s.removeList);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listsService.getAll();
      setLists(result.data);
    } catch {
      toast.error('Error loading lists');
    } finally {
      setLoading(false);
    }
  }, [setLists, setLoading]);

  const createList = useCallback(
    async (data: CreateListRequest) => {
      try {
        const list = await listsService.create(data);
        addList(list);
        toast.success('List created');
        return list;
      } catch {
        toast.error('Error creating list');
      }
    },
    [addList]
  );

  const updateList = useCallback(
    async (id: string, data: UpdateListRequest) => {
      try {
        const list = await listsService.update(id, data);
        updateListStore(list);
        toast.success('List updated');
        return list;
      } catch {
        toast.error('Error updating list');
      }
    },
    [updateListStore]
  );

  const deleteList = useCallback(
    async (id: string) => {
      try {
        await listsService.remove(id);
        removeList(id);
        toast.success('List deleted');
      } catch {
        toast.error('Error deleting list');
      }
    },
    [removeList]
  );

  const togglePin = useCallback(
    async (id: string) => {
      try {
        const list = await listsService.togglePin(id);
        updateListStore(list);
      } catch {
        toast.error('Error toggling pin');
      }
    },
    [updateListStore]
  );

  return {
    lists,
    isLoading,
    fetchLists,
    createList,
    updateList,
    deleteList,
    togglePin,
  };
}
