import { useCallback } from 'react';
import { useCategoriesStore } from '../store/categories.store';
import { categoriesService } from '../services/categories.service';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@todo-list-pro/shared';
import { toast } from 'sonner';

export function useCategories() {
  const categories = useCategoriesStore((s) => s.categories);
  const isLoading = useCategoriesStore((s) => s.isLoading);
  const setCategories = useCategoriesStore((s) => s.setCategories);
  const setLoading = useCategoriesStore((s) => s.setLoading);
  const addCategory = useCategoriesStore((s) => s.addCategory);
  const updateCategoryStore = useCategoriesStore((s) => s.updateCategory);
  const removeCategory = useCategoriesStore((s) => s.removeCategory);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await categoriesService.getAll();
      setCategories(result.data);
    } catch {
      toast.error('Error loading categories');
    } finally {
      setLoading(false);
    }
  }, [setCategories, setLoading]);

  const createCategory = useCallback(
    async (data: CreateCategoryRequest) => {
      try {
        const category = await categoriesService.create(data);
        addCategory(category);
        toast.success('Category created');
        return category;
      } catch {
        toast.error('Error creating category');
      }
    },
    [addCategory]
  );

  const updateCategory = useCallback(
    async (id: string, data: UpdateCategoryRequest) => {
      try {
        const category = await categoriesService.update(id, data);
        updateCategoryStore(category);
        toast.success('Category updated');
        return category;
      } catch {
        toast.error('Error updating category');
      }
    },
    [updateCategoryStore]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        await categoriesService.remove(id);
        removeCategory(id);
        toast.success('Category deleted');
      } catch {
        toast.error('Error deleting category');
      }
    },
    [removeCategory]
  );

  return {
    categories,
    isLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
