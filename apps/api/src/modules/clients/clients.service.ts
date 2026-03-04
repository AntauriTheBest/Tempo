import { prisma } from '../../config';
import { AppError } from '../../middleware';
import { buildPaginationMeta } from '../../shared';
import type { CreateClientRequest, UpdateClientRequest } from '@todo-list-pro/shared';

export async function getAll(
  organizationId: string,
  page: number = 1,
  limit: number = 50
) {
  const skip = (page - 1) * limit;

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: { _count: { select: { lists: true } } },
    }),
    prisma.client.count({ where: { organizationId } }),
  ]);

  return {
    data: clients,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getById(organizationId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId },
    include: { _count: { select: { lists: true } } },
  });
  if (!client) throw new AppError(404, 'Client not found');
  return client;
}

export async function create(
  organizationId: string,
  data: CreateClientRequest
) {
  // Enforce unique name per organization
  const existing = await prisma.client.findFirst({
    where: { organizationId, name: data.name },
  });
  if (existing) throw new AppError(409, 'A client with this name already exists in the organization');

  return prisma.client.create({
    data: { ...data, organizationId },
    include: { _count: { select: { lists: true } } },
  });
}

export async function update(
  organizationId: string,
  clientId: string,
  data: UpdateClientRequest
) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId },
  });
  if (!client) throw new AppError(404, 'Client not found');

  // If name is changing, check uniqueness within the org
  if (data.name && data.name !== client.name) {
    const nameConflict = await prisma.client.findFirst({
      where: { organizationId, name: data.name, id: { not: clientId } },
    });
    if (nameConflict) throw new AppError(409, 'A client with this name already exists in the organization');
  }

  return prisma.client.update({
    where: { id: clientId },
    data,
    include: { _count: { select: { lists: true } } },
  });
}

export async function remove(organizationId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId },
  });
  if (!client) throw new AppError(404, 'Client not found');

  await prisma.client.delete({ where: { id: clientId } });
}
