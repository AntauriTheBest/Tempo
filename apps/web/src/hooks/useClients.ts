import { useCallback } from 'react';
import { useClientsStore } from '../store/clients.store';
import { clientsService } from '../services/clients.service';
import type {
  CreateClientRequest,
  UpdateClientRequest,
} from '@todo-list-pro/shared';
import { toast } from 'sonner';

export function useClients() {
  const clients = useClientsStore((s) => s.clients);
  const isLoading = useClientsStore((s) => s.isLoading);
  const setClients = useClientsStore((s) => s.setClients);
  const setLoading = useClientsStore((s) => s.setLoading);
  const addClient = useClientsStore((s) => s.addClient);
  const updateClientStore = useClientsStore((s) => s.updateClient);
  const removeClient = useClientsStore((s) => s.removeClient);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const result = await clientsService.getAll();
      setClients(result.data);
    } catch {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, [setClients, setLoading]);

  const createClient = useCallback(
    async (data: CreateClientRequest) => {
      try {
        const client = await clientsService.create(data);
        addClient(client);
        toast.success('Cliente creado');
        return client;
      } catch {
        toast.error('Error al crear cliente');
      }
    },
    [addClient]
  );

  const updateClient = useCallback(
    async (id: string, data: UpdateClientRequest) => {
      try {
        const client = await clientsService.update(id, data);
        updateClientStore(client);
        toast.success('Cliente actualizado');
        return client;
      } catch {
        toast.error('Error al actualizar cliente');
      }
    },
    [updateClientStore]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      try {
        await clientsService.remove(id);
        removeClient(id);
        toast.success('Cliente eliminado');
      } catch {
        toast.error('Error al eliminar cliente');
      }
    },
    [removeClient]
  );

  return {
    clients,
    isLoading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
}
