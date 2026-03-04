import { create } from 'zustand';
import type { Client } from '@todo-list-pro/shared';

interface ClientsState {
  clients: Client[];
  isLoading: boolean;
  setClients: (clients: Client[]) => void;
  setLoading: (loading: boolean) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  removeClient: (id: string) => void;
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  isLoading: false,

  setClients: (clients) => set({ clients }),
  setLoading: (isLoading) => set({ isLoading }),
  addClient: (client) =>
    set((state) => ({ clients: [...state.clients, client] })),
  updateClient: (client) =>
    set((state) => ({
      clients: state.clients.map((c) => (c.id === client.id ? client : c)),
    })),
  removeClient: (id) =>
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    })),
}));
