export interface Client {
  id: string;
  name: string;
  color: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { lists: number };
}

export interface CreateClientRequest {
  name: string;
  color?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateClientRequest {
  name?: string;
  color?: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}
