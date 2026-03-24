import { Prisma } from '@prisma/client';
import { prisma } from '../../config';
import { AppError } from '../../middleware';
import { buildPaginationMeta } from '../../shared';
import { runAutomations } from '../automations/automations.service';

const taskIncludeBase = {
  category: { select: { id: true, name: true, color: true, icon: true } },
  list: { select: { id: true, name: true, color: true } },
  tags: {
    include: { tag: { select: { id: true, name: true, color: true } } },
  },
  assignments: {
    include: { user: { select: { id: true, name: true, avatar: true } } },
  },
  attachments: {
    select: { id: true, filename: true, originalName: true, mimetype: true, size: true, createdAt: true, userId: true },
    orderBy: { createdAt: 'asc' as const },
  },
  recurrenceRule: true,
} satisfies Prisma.TaskInclude;

const taskInclude = {
  ...taskIncludeBase,
  subtasks: {
    orderBy: { order: 'asc' as const },
    include: taskIncludeBase,
  },
} satisfies Prisma.TaskInclude;

function transformTask(task: any): any {
  return {
    ...task,
    tags: task.tags?.map((tt: any) => tt.tag) ?? [],
    assignees: task.assignments?.map((a: any) => a.user) ?? [],
    assignments: undefined,
    attachments: (task.attachments ?? []).map((a: any) => ({
      ...a,
      url: `/uploads/${a.filename}`,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    })),
    subtasks: task.subtasks?.map((sub: any) => ({
      ...sub,
      tags: sub.tags?.map((tt: any) => tt.tag) ?? [],
      assignees: sub.assignments?.map((a: any) => a.user) ?? [],
      assignments: undefined,
      attachments: (sub.attachments ?? []).map((a: any) => ({
        ...a,
        url: `/uploads/${a.filename}`,
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
      })),
    })) ?? [],
  };
}

export async function getAll(
  userId: string,
  organizationId: string,
  filters: {
    status?: string;
    categoryId?: string;
    listId?: string;
    clientId?: string;
    tagIds?: string;
    priority?: string;
    search?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    isRecurring?: string;
    parentId?: string;
    assignedTo?: string;
    sortBy?: string;
    sortDir?: string;
    page?: number;
    limit?: number;
    includeArchived?: string;
  },
  role?: string
) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  // Admins see all tasks of their org; regular users see only owned or assigned within the org
  const where: Prisma.TaskWhereInput = role === 'ADMIN'
    ? { organizationId }
    : {
        organizationId,
        OR: [
          { userId },
          { assignments: { some: { userId } } },
        ],
      };

  if (filters.status) {
    const statuses = filters.status.split(',');
    where.status = { in: statuses as any };
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.listId) {
    where.listId = filters.listId;
  }

  if (filters.clientId) {
    where.list = { is: { clientId: filters.clientId } };
  }

  if (filters.tagIds) {
    const tagIdList = filters.tagIds.split(',');
    where.tags = { some: { tagId: { in: tagIdList } } };
  }

  if (filters.priority) {
    const priorities = filters.priority.split(',');
    where.priority = priorities.length === 1 ? (priorities[0] as any) : { in: priorities as any };
  }

  if (filters.search) {
    where.title = { contains: filters.search, mode: 'insensitive' };
  }

  if (filters.dueDateFrom || filters.dueDateTo) {
    where.dueDate = {};
    if (filters.dueDateFrom) {
      where.dueDate.gte = new Date(filters.dueDateFrom);
    }
    if (filters.dueDateTo) {
      where.dueDate.lte = new Date(filters.dueDateTo);
    }
  }

  if (filters.isRecurring !== undefined) {
    where.isRecurring = filters.isRecurring === 'true';
  }

  if (filters.assignedTo) {
    const userIds = filters.assignedTo.split(',');
    where.assignments = { some: { userId: { in: userIds } } };
  }

  if (filters.parentId !== undefined) {
    if (filters.parentId === 'null') {
      where.parentId = null;
    } else {
      where.parentId = filters.parentId;
    }
  } else {
    // Default: only root tasks
    where.parentId = null;
  }

  // Hide tasks completed/cancelled more than 30 days ago unless explicitly requested
  if (filters.includeArchived !== 'true') {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    where.NOT = {
      AND: [
        { status: { in: ['COMPLETED', 'CANCELLED'] } },
        { updatedAt: { lt: cutoff } },
      ],
    };
  }

  // Build orderBy
  const sortBy = filters.sortBy ?? 'order';
  const sortDir = (filters.sortDir ?? 'asc') as 'asc' | 'desc';

  let orderBy: Prisma.TaskOrderByWithRelationInput;
  if (sortBy === 'priority') {
    orderBy = { priority: sortDir };
  } else if (sortBy === 'dueDate') {
    orderBy = { dueDate: { sort: sortDir, nulls: 'last' } };
  } else if (sortBy === 'createdAt') {
    orderBy = { createdAt: sortDir };
  } else if (sortBy === 'updatedAt') {
    orderBy = { updatedAt: sortDir };
  } else if (sortBy === 'title') {
    orderBy = { title: sortDir };
  } else if (sortBy === 'status') {
    orderBy = { status: sortDir };
  } else {
    orderBy = { order: sortDir };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: taskInclude,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data: tasks.map(transformTask),
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getById(
  userId: string,
  organizationId: string,
  taskId: string,
  role?: string
) {
  const ownershipFilter: Prisma.TaskWhereInput = role === 'ADMIN'
    ? { organizationId }
    : { organizationId, OR: [{ userId }, { assignments: { some: { userId } } }] };

  const task = await prisma.task.findFirst({
    where: { id: taskId, ...ownershipFilter },
    include: taskInclude,
  });

  if (!task) throw new AppError(404, 'Task not found');

  return transformTask(task);
}

export async function create(
  userId: string,
  organizationId: string,
  data: {
    title: string;
    description?: string;
    dueDate?: string;
    categoryId?: string;
    listId?: string;
    priority?: string;
    parentId?: string;
    tagIds?: string[];
    assigneeIds?: string[];
    isRecurring?: boolean;
    recurrence?: {
      frequency: string;
      interval?: number;
      dayOfMonth?: number;
      startDate: string;
      endDate?: string;
    };
  },
  role?: string
) {
  // Validate parentId if provided
  if (data.parentId) {
    const parentFilter: Prisma.TaskWhereInput = role === 'ADMIN'
      ? { id: data.parentId, organizationId }
      : { id: data.parentId, userId, organizationId };
    const parent = await prisma.task.findFirst({
      where: parentFilter,
    });
    if (!parent) throw new AppError(404, 'Parent task not found');
    if (parent.parentId) {
      throw new AppError(422, 'Cannot create subtask of a subtask');
    }
  }

  const maxOrder = await prisma.task.aggregate({
    where: {
      userId,
      organizationId,
      listId: data.listId ?? null,
      parentId: data.parentId ?? null,
    },
    _max: { order: true },
  });

  const { tagIds, assigneeIds, dueDate, isRecurring, recurrence, ...taskData } = data;

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        ...taskData,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        userId,
        organizationId,
        order: (maxOrder._max.order ?? -1) + 1,
        priority: (data.priority as any) ?? 'NONE',
        isRecurring: isRecurring ?? false,
      },
    });

    // Create recurrence rule if task is recurring
    if (isRecurring && recurrence) {
      await tx.recurrenceRule.create({
        data: {
          taskId: created.id,
          frequency: recurrence.frequency as any,
          interval: recurrence.interval ?? 1,
          dayOfMonth: recurrence.dayOfMonth ?? 1,
          startDate: new Date(recurrence.startDate),
          endDate: recurrence.endDate ? new Date(recurrence.endDate) : null,
          isActive: true,
        },
      });
    }

    if (tagIds && tagIds.length > 0) {
      await tx.taskTag.createMany({
        data: tagIds.map((tagId) => ({
          taskId: created.id,
          tagId,
        })),
      });
    }

    // Auto-assign creator + additional assignees
    const allAssigneeIds = [...new Set([userId, ...(assigneeIds ?? [])])];
    await tx.taskAssignment.createMany({
      data: allAssigneeIds.map((uid) => ({
        taskId: created.id,
        userId: uid,
      })),
    });

    return tx.task.findUnique({
      where: { id: created.id },
      include: taskInclude,
    });
  });

  return transformTask(task);
}

export async function update(
  userId: string,
  organizationId: string,
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    dueDate?: string | null;
    categoryId?: string | null;
    listId?: string | null;
    priority?: string;
    tagIds?: string[];
    assigneeIds?: string[];
  },
  role?: string
) {
  const ownershipFilter: Prisma.TaskWhereInput = role === 'ADMIN'
    ? { organizationId }
    : { organizationId, OR: [{ userId }, { assignments: { some: { userId } } }] };

  const existing = await prisma.task.findFirst({
    where: { id: taskId, ...ownershipFilter },
  });
  if (!existing) throw new AppError(404, 'Task not found');

  const { tagIds, assigneeIds, dueDate, ...taskData } = data;

  const task = await prisma.$transaction(async (tx) => {
    const updateData: any = { ...taskData };
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    await tx.task.update({
      where: { id: taskId },
      data: updateData,
    });

    if (tagIds !== undefined) {
      await tx.taskTag.deleteMany({ where: { taskId } });
      if (tagIds.length > 0) {
        await tx.taskTag.createMany({
          data: tagIds.map((tagId) => ({ taskId, tagId })),
        });
      }
    }

    if (assigneeIds !== undefined) {
      await tx.taskAssignment.deleteMany({ where: { taskId } });
      const allIds = [...new Set([existing.userId, ...assigneeIds])];
      await tx.taskAssignment.createMany({
        data: allIds.map((uid) => ({ taskId, userId: uid })),
      });
    }

    return tx.task.findUnique({
      where: { id: taskId },
      include: taskInclude,
    });
  });

  return transformTask(task);
}

export async function remove(
  userId: string,
  organizationId: string,
  taskId: string,
  role?: string
) {
  const ownershipFilter: Prisma.TaskWhereInput = role === 'ADMIN'
    ? { organizationId }
    : { organizationId, OR: [{ userId }, { assignments: { some: { userId } } }] };

  const task = await prisma.task.findFirst({
    where: { id: taskId, ...ownershipFilter },
  });
  if (!task) throw new AppError(404, 'Task not found');

  await prisma.task.delete({ where: { id: taskId } });
}

export async function updateStatus(
  userId: string,
  organizationId: string,
  taskId: string,
  status: string,
  role?: string
) {
  const ownershipFilter: Prisma.TaskWhereInput = role === 'ADMIN'
    ? { organizationId }
    : { organizationId, OR: [{ userId }, { assignments: { some: { userId } } }] };

  const task = await prisma.task.findFirst({
    where: { id: taskId, ...ownershipFilter },
    include: { assignments: { select: { userId: true } } },
  });
  if (!task) throw new AppError(404, 'Task not found');

  // Block completion if unresolved dependencies exist
  if (status === 'COMPLETED') {
    const blockers = await prisma.taskDependency.findMany({
      where: { taskId, dependsOn: { status: { not: 'COMPLETED' } } },
      include: { dependsOn: { select: { title: true } } },
    });
    if (blockers.length > 0) {
      const names = blockers.map((b) => `"${b.dependsOn.title}"`).join(', ');
      throw new AppError(422, `Cannot complete task: blocked by ${names}`);
    }
  }

  const updateData: any = { status };
  if (status === 'COMPLETED') {
    updateData.completedAt = new Date();
  } else if (task.status === 'COMPLETED') {
    updateData.completedAt = null;
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: taskInclude,
  });

  // Fire automations async (non-blocking)
  const assigneeIds = (task.assignments ?? []).map((a: any) => a.userId);
  runAutomations(organizationId, 'TASK_COMPLETED' as any, {
    taskId,
    taskTitle: task.title,
    newStatus: status,
    assigneeIds,
    listId: task.listId,
  }).catch(() => {});

  if (status !== task.status) {
    runAutomations(organizationId, 'STATUS_CHANGED' as any, {
      taskId,
      taskTitle: task.title,
      newStatus: status,
      assigneeIds,
      listId: task.listId,
    }).catch(() => {});
  }

  return transformTask(updated);
}

export async function moveTask(
  userId: string,
  organizationId: string,
  taskId: string,
  data: { listId?: string | null; categoryId?: string | null },
  role?: string
) {
  const ownershipFilter: Prisma.TaskWhereInput = role === 'ADMIN'
    ? { organizationId }
    : { organizationId, OR: [{ userId }, { assignments: { some: { userId } } }] };

  const task = await prisma.task.findFirst({
    where: { id: taskId, ...ownershipFilter },
  });
  if (!task) throw new AppError(404, 'Task not found');

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: taskInclude,
  });

  return transformTask(updated);
}

export async function reorder(
  userId: string,
  organizationId: string,
  items: { id: string; order: number }[]
) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.task.updateMany({
        where: { id: item.id, userId, organizationId },
        data: { order: item.order },
      })
    )
  );
}

export async function createSubtask(
  userId: string,
  organizationId: string,
  parentId: string,
  data: {
    title: string;
    description?: string;
    dueDate?: string;
    categoryId?: string;
    listId?: string;
    priority?: string;
    tagIds?: string[];
  },
  role?: string
) {
  const ownershipFilter: Prisma.TaskWhereInput = role === 'ADMIN'
    ? { organizationId }
    : { organizationId, OR: [{ userId }, { assignments: { some: { userId } } }] };

  const parent = await prisma.task.findFirst({
    where: {
      id: parentId,
      ...ownershipFilter,
    },
  });
  if (!parent) throw new AppError(404, 'Parent task not found');
  if (parent.parentId) {
    throw new AppError(422, 'Cannot create subtask of a subtask');
  }

  return create(userId, organizationId, { ...data, parentId }, role);
}

export async function duplicate(
  userId: string,
  organizationId: string,
  taskId: string,
  role?: string
) {
  const ownershipFilter: Prisma.TaskWhereInput = role === 'ADMIN'
    ? { organizationId }
    : { organizationId, OR: [{ userId }, { assignments: { some: { userId } } }] };

  const original = await prisma.task.findFirst({
    where: { id: taskId, ...ownershipFilter },
    include: { tags: true, assignments: true },
  });
  if (!original) throw new AppError(404, 'Task not found');

  const maxOrder = await prisma.task.aggregate({
    where: {
      userId,
      organizationId,
      listId: original.listId,
      parentId: original.parentId,
    },
    _max: { order: true },
  });

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title: `Copy of ${original.title}`,
        description: original.description,
        dueDate: original.dueDate,
        categoryId: original.categoryId,
        listId: original.listId,
        priority: original.priority,
        parentId: original.parentId,
        userId,
        organizationId,
        order: (maxOrder._max.order ?? -1) + 1,
        status: 'PENDING',
      },
    });

    if (original.tags.length > 0) {
      await tx.taskTag.createMany({
        data: original.tags.map((tt) => ({
          taskId: created.id,
          tagId: tt.tagId,
        })),
      });
    }

    if (original.assignments.length > 0) {
      await tx.taskAssignment.createMany({
        data: original.assignments.map((a) => ({
          taskId: created.id,
          userId: a.userId,
        })),
      });
    }

    return tx.task.findUnique({
      where: { id: created.id },
      include: taskInclude,
    });
  });

  return transformTask(task);
}

export async function getGraph(userId: string, organizationId: string, role?: string) {
  const ownershipFilter: Prisma.TaskWhereInput = role === 'ADMIN'
    ? { organizationId, parentId: null }
    : { organizationId, parentId: null, OR: [{ userId }, { assignments: { some: { userId } } }] };

  const [tasks, edges] = await Promise.all([
    prisma.task.findMany({
      where: ownershipFilter,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        listId: true,
        list: { select: { id: true, name: true, color: true } },
        assignments: { select: { user: { select: { id: true, name: true, avatar: true } } } },
      },
      orderBy: { order: 'asc' },
      take: 300,
    }),
    prisma.taskDependency.findMany({
      where: { task: { organizationId } },
      select: { taskId: true, dependsOnId: true },
    }),
  ]);

  return {
    nodes: tasks.map((t) => ({
      ...t,
      assignees: (t.assignments ?? []).map((a: any) => a.user),
      assignments: undefined,
    })),
    edges,
  };
}
