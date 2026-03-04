import { create } from 'zustand';
import type { TaskList } from '@todo-list-pro/shared';

interface ListsState {
  lists: TaskList[];
  isLoading: boolean;
  setLists: (lists: TaskList[]) => void;
  setLoading: (loading: boolean) => void;
  addList: (list: TaskList) => void;
  updateList: (list: TaskList) => void;
  removeList: (id: string) => void;
}

export const useListsStore = create<ListsState>((set) => ({
  lists: [],
  isLoading: false,

  setLists: (lists) => set({ lists }),
  setLoading: (isLoading) => set({ isLoading }),
  addList: (list) =>
    set((state) => ({ lists: [...state.lists, list] })),
  updateList: (list) =>
    set((state) => ({
      lists: state.lists.map((l) => (l.id === list.id ? list : l)),
    })),
  removeList: (id) =>
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== id),
    })),
}));
