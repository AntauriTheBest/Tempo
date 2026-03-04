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

  const [lists, total] = await Promise.all([
    prisma.taskList.findMany({
      where: { userId, organizationId },
      orderBy: [{ isPinned: 'desc' }, { order: 'asc' }],
      skip,
      take: limit,
      include: {
        client: { select: { id: true, name: true, color: true } },
        _count: { select: { tasks: true } },
      },
    }),
    prisma.taskList.count({ where: { userId, organizationId } }),
  ]);

  return {
    data: lists,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getById(
  userId: string,
  organizationId: string,
  listId: string
) {
  const list = await prisma.taskList.findFirst({
    where: { id: listId, userId, organizationId },
    include: {
      client: { select: { id: true, name: true, color: true } },
      _count: { select: { tasks: true } },
      tasks: {
        where: { parentId: null },
        orderBy: { order: 'asc' },
        take: 50,
        include: {
          category: { select: { id: true, name: true, color: true, icon: true } },
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
          _count: { select: { subtasks: true } },
        },
      },
    },
  });

  if (!list) throw new AppError(404, 'List not found');

  // Transform tags structure
  const tasks = list.tasks.map((task) => ({
    ...task,
    tags: task.tags.map((tt) => tt.tag),
  }));

  return { ...list, tasks };
}

export async function create(
  userId: string,
  organizationId: string,
  data: { name: string; description?: string; color?: string; icon?: string; clientId?: string }
) {
  const maxOrder = await prisma.taskList.aggregate({
    where: { userId, organizationId },
    _max: { order: true },
  });

  return prisma.taskList.create({
    data: {
      ...data,
      userId,
      organizationId,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    include: {
      client: { select: { id: true, name: true, color: true } },
      _count: { select: { tasks: true } },
    },
  });
}

export async function update(
  userId: string,
  organizationId: string,
  listId: string,
  data: { name?: string; description?: string | null; color?: string; icon?: string | null; clientId?: string | null }
) {
  const list = await prisma.taskList.findFirst({
    where: { id: listId, userId, organizationId },
  });
  if (!list) throw new AppError(404, 'List not found');

  return prisma.taskList.update({
    where: { id: listId },
    data,
    include: {
      client: { select: { id: true, name: true, color: true } },
      _count: { select: { tasks: true } },
    },
  });
}

export async function remove(
  userId: string,
  organizationId: string,
  listId: string
) {
  const list = await prisma.taskList.findFirst({
    where: { id: listId, userId, organizationId },
  });
  if (!list) throw new AppError(404, 'List not found');

  await prisma.taskList.delete({ where: { id: listId } });
}

export async function togglePin(
  userId: string,
  organizationId: string,
  listId: string
) {
  const list = await prisma.taskList.findFirst({
    where: { id: listId, userId, organizationId },
  });
  if (!list) throw new AppError(404, 'List not found');

  return prisma.taskList.update({
    where: { id: listId },
    data: { isPinned: !list.isPinned },
    include: {
      client: { select: { id: true, name: true, color: true } },
      _count: { select: { tasks: true } },
    },
  });
}

export async function reorder(
  userId: string,
  organizationId: string,
  items: { id: string; order: number }[]
) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.taskList.updateMany({
        where: { id: item.id, userId, organizationId },
        data: { order: item.order },
      })
    )
  );
}
