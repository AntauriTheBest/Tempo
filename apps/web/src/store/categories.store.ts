import { create } from 'zustand';
import type { Category } from '@todo-list-pro/shared';

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  setCategories: (categories: Category[]) => void;
  setLoading: (loading: boolean) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  isLoading: false,

  setCategories: (categories) => set({ categories }),
  setLoading: (isLoading) => set({ isLoading }),
  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (category) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === category.id ? category : c
      ),
    })),
  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
}));
