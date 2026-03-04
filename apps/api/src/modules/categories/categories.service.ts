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

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where: { userId, organizationId },
      orderBy: { order: 'asc' },
      skip,
      take: limit,
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.category.count({ where: { userId, organizationId } }),
  ]);

  return {
    data: categories,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function create(
  userId: string,
  organizationId: string,
  data: { name: string; color?: string; icon?: string }
) {
  const maxOrder = await prisma.category.aggregate({
    where: { userId, organizationId },
    _max: { order: true },
  });

  return prisma.category.create({
    data: {
      ...data,
      userId,
      organizationId,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    include: { _count: { select: { tasks: true } } },
  });
}

export async function update(
  userId: string,
  organizationId: string,
  categoryId: string,
  data: { name?: string; color?: string; icon?: string | null }
) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId, organizationId },
  });
  if (!category) throw new AppError(404, 'Category not found');

  return prisma.category.update({
    where: { id: categoryId },
    data,
    include: { _count: { select: { tasks: true } } },
  });
}

export async function remove(
  userId: string,
  organizationId: string,
  categoryId: string
) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId, organizationId },
  });
  if (!category) throw new AppError(404, 'Category not found');

  await prisma.category.delete({ where: { id: categoryId } });
}

export async function reorder(
  userId: string,
  organizationId: string,
  items: { id: string; order: number }[]
) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.category.updateMany({
        where: { id: item.id, userId, organizationId },
        data: { order: item.order },
      })
    )
  );
}
