import { prisma } from '../../config';
import { AppError } from '../../middleware';
import { buildPaginationMeta } from '../../shared';

export async function getAll(
  userId: string,
  organizationId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [tags, total] = await Promise.all([
    prisma.tag.findMany({
      where: { userId, organizationId },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.tag.count({ where: { userId, organizationId } }),
  ]);

  return {
    data: tags,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function create(
  userId: string,
  organizationId: string,
  data: { name: string; color?: string }
) {
  return prisma.tag.create({
    data: { ...data, userId, organizationId },
    include: { _count: { select: { tasks: true } } },
  });
}

export async function update(
  userId: string,
  organizationId: string,
  tagId: string,
  data: { name?: string; color?: string }
) {
  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId, organizationId },
  });
  if (!tag) throw new AppError(404, 'Tag not found');

  return prisma.tag.update({
    where: { id: tagId },
    data,
    include: { _count: { select: { tasks: true } } },
  });
}

export async function remove(
  userId: string,
  organizationId: string,
  tagId: string
) {
  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId, organizationId },
  });
  if (!tag) throw new AppError(404, 'Tag not found');

  await prisma.tag.delete({ where: { id: tagId } });
}
