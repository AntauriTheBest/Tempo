import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config';
import { AppError } from '../../middleware';
import { buildPaginationMeta } from '../../shared';
import { defaultCategories, defaultLists } from '../../shared/default-data';
import type { InviteUserRequest, AdminUpdateUserRequest, UserRole } from '@todo-list-pro/shared';

export async function getUsers(organizationId: string, page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where: { organizationId } }),
  ]);

  return {
    data: users,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getUserById(organizationId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export async function inviteUser(organizationId: string, data: InviteUserRequest) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const placeholderHash = await bcrypt.hash(randomUUID(), 12);
  const invitationToken = randomUUID();

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: placeholderHash,
        role: (data.role || 'USER') as any,
        isActive: false,
        organizationId,
      },
    });

    await tx.invitationToken.create({
      data: {
        token: invitationToken,
        email: data.email,
        userId: newUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    await tx.category.createMany({
      data: defaultCategories.map((cat, i) => ({
        ...cat,
        userId: newUser.id,
        organizationId,
        order: i,
      })),
    });

    await tx.taskList.createMany({
      data: defaultLists.map((list, i) => ({
        ...list,
        userId: newUser.id,
        organizationId,
        order: i,
      })),
    });

    return newUser;
  });

  const invitationUrl = `/invite?token=${invitationToken}`;
  console.log(`\n[INVITATION] User: ${data.email} | URL: ${invitationUrl}\n`);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    invitationUrl,
  };
}

export async function updateUser(organizationId: string, userId: string, data: AdminUpdateUserRequest) {
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
  if (!user) throw new AppError(404, 'User not found');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.role !== undefined && { role: data.role as any }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}

export async function resendInvitation(organizationId: string, userId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
  if (!user) throw new AppError(404, 'User not found');

  // Invalidate old tokens
  await prisma.invitationToken.updateMany({
    where: { userId, usedAt: null },
    data: { expiresAt: new Date() },
  });

  const invitationToken = randomUUID();
  await prisma.invitationToken.create({
    data: {
      token: invitationToken,
      email: user.email,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const invitationUrl = `/invite?token=${invitationToken}`;
  console.log(`\n[INVITATION RESENT] User: ${user.email} | URL: ${invitationUrl}\n`);

  return { invitationUrl };
}

export async function getAllTasks(organizationId: string, filters: {
  status?: string;
  userId?: string;
  search?: string;
  priority?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.TaskWhereInput = { parentId: null, user: { organizationId } };

  if (filters.status) {
    const statuses = filters.status.split(',');
    where.status = { in: statuses as any };
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.priority) {
    where.priority = filters.priority as any;
  }

  if (filters.search) {
    where.title = { contains: filters.search, mode: 'insensitive' };
  }

  const sortBy = filters.sortBy ?? 'createdAt';
  const sortDir = (filters.sortDir ?? 'desc') as 'asc' | 'desc';

  let orderBy: Prisma.TaskOrderByWithRelationInput;
  if (sortBy === 'priority') orderBy = { priority: sortDir };
  else if (sortBy === 'dueDate') orderBy = { dueDate: { sort: sortDir, nulls: 'last' } };
  else if (sortBy === 'title') orderBy = { title: sortDir };
  else if (sortBy === 'status') orderBy = { status: sortDir };
  else if (sortBy === 'user') orderBy = { user: { name: sortDir } };
  else if (sortBy === 'list') orderBy = { list: { name: sortDir } };
  else orderBy = { createdAt: sortDir };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, color: true } },
        list: { select: { id: true, name: true, color: true, client: { select: { id: true, name: true, color: true } } } },
        _count: { select: { subtasks: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data: tasks,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getStats(organizationId: string) {
  const [totalUsers, activeUsers, totalTasks, tasksByStatus] = await Promise.all([
    prisma.user.count({ where: { organizationId } }),
    prisma.user.count({ where: { organizationId, isActive: true } }),
    prisma.task.count({ where: { parentId: null, user: { organizationId } } }),
    prisma.task.groupBy({
      by: ['status'],
      where: { parentId: null, user: { organizationId } },
      _count: { id: true },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of tasksByStatus) {
    statusMap[row.status] = row._count.id;
  }

  return { totalUsers, activeUsers, totalTasks, tasksByStatus: statusMap };
}

// ==================== RECURRENCE / IGUALAS ====================

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

function getDueDate(year: number, month: number, dayOfMonth: number | null) {
  const day = dayOfMonth ?? 1;
  const lastDay = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(day, lastDay));
}

export async function generateMonthlyTasks(year: number, month: number) {
  const { start, end } = getMonthRange(year, month);

  // Find all active monthly recurrence rules
  const rules = await prisma.recurrenceRule.findMany({
    where: {
      isActive: true,
      frequency: 'MONTHLY',
      startDate: { lte: end },
      OR: [
        { endDate: null },
        { endDate: { gte: start } },
      ],
    },
    include: {
      task: {
        include: {
          tags: true,
          assignments: true,
        },
      },
    },
  });

  let generated = 0;
  let skipped = 0;

  for (const rule of rules) {
    const template = rule.task;

    // Check if instance already exists for this month
    const existing = await prisma.task.findFirst({
      where: {
        generatedFromId: template.id,
        dueDate: { gte: start, lte: end },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Create instance
    const dueDate = getDueDate(year, month, rule.dayOfMonth);

    await prisma.$transaction(async (tx) => {
      const instance = await tx.task.create({
        data: {
          title: template.title,
          description: template.description,
          priority: template.priority,
          categoryId: template.categoryId,
          listId: template.listId,
          userId: template.userId,
          organizationId: template.organizationId,
          generatedFromId: template.id,
          dueDate,
          status: 'PENDING',
          order: 0,
        },
      });

      // Copy tags
      if (template.tags.length > 0) {
        await tx.taskTag.createMany({
          data: template.tags.map((tt) => ({
            taskId: instance.id,
            tagId: tt.tagId,
          })),
        });
      }

      // Copy assignees
      if (template.assignments.length > 0) {
        await tx.taskAssignment.createMany({
          data: template.assignments.map((a) => ({
            taskId: instance.id,
            userId: a.userId,
          })),
        });
      }
    });

    generated++;
  }

  // Update generatedUntil on processed rules
  if (rules.length > 0) {
    await prisma.recurrenceRule.updateMany({
      where: { id: { in: rules.map((r) => r.id) } },
      data: { generatedUntil: end },
    });
  }

  return { generated, skipped, total: rules.length };
}

export async function getMonthlyReport(year: number, month: number) {
  const { start, end } = getMonthRange(year, month);

  // Find all clients that have recurring templates
  const clients = await prisma.client.findMany({
    where: {
      lists: {
        some: {
          tasks: {
            some: {
              isRecurring: true,
              recurrenceRule: { isActive: true, frequency: 'MONTHLY' },
            },
          },
        },
      },
    },
    select: { id: true, name: true, color: true },
  });

  const reports = [];

  for (const client of clients) {
    const report = await buildClientReport(client, year, month, start, end);
    reports.push(report);
  }

  return reports;
}

export async function getClientMonthlyDetail(
  clientId: string,
  year: number,
  month: number
) {
  const { start, end } = getMonthRange(year, month);

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, color: true },
  });

  if (!client) throw new AppError(404, 'Client not found');

  return buildClientReport(client, year, month, start, end);
}

async function buildClientReport(
  client: { id: string; name: string; color: string },
  _year: number,
  _month: number,
  start: Date,
  end: Date
) {
  // Get all recurring templates for this client
  const templates = await prisma.task.findMany({
    where: {
      isRecurring: true,
      recurrenceRule: { isActive: true, frequency: 'MONTHLY' },
      list: { clientId: client.id },
      parentId: null,
    },
    include: {
      assignments: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  const tasks = [];
  let completedCount = 0;

  for (const template of templates) {
    // Find instance for this month
    const instance = await prisma.task.findFirst({
      where: {
        generatedFromId: template.id,
        dueDate: { gte: start, lte: end },
      },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    const status = instance?.status ?? 'PENDING';
    if (status === 'COMPLETED') completedCount++;

    tasks.push({
      templateId: template.id,
      templateTitle: template.title,
      instanceId: instance?.id ?? null,
      status,
      completedAt: instance?.completedAt?.toISOString() ?? null,
      assignees: (instance ?? template).assignments.map((a) => a.user),
    });
  }

  return {
    client,
    totalTemplates: templates.length,
    completedInstances: completedCount,
    pendingInstances: templates.length - completedCount,
    tasks,
  };
}
