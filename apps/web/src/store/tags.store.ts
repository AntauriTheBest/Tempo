import { create } from 'zustand';
import type { Tag } from '@todo-list-pro/shared';

interface TagsState {
  tags: Tag[];
  isLoading: boolean;
  setTags: (tags: Tag[]) => void;
  setLoading: (loading: boolean) => void;
  addTag: (tag: Tag) => void;
  updateTag: (tag: Tag) => void;
  removeTag: (id: string) => void;
}

export const useTagsStore = create<TagsState>((set) => ({
  tags: [],
  isLoading: false,

  setTags: (tags) => set({ tags }),
  setLoading: (isLoading) => set({ isLoading }),
  addTag: (tag) =>
    set((state) => ({ tags: [...state.tags, tag] })),
  updateTag: (tag) =>
    set((state) => ({
      tags: state.tags.map((t) => (t.id === tag.id ? tag : t)),
    })),
  removeTag: (id) =>
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
    })),
}));
