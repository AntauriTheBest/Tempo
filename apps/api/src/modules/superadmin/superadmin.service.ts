import { prisma } from '../../config';
import { AppError } from '../../middleware';

export async function getGlobalStats() {
  const [totalOrgs, totalUsers, totalTasks, diskUsage] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.task.count({ where: { parentId: null } }),
    prisma.attachment.aggregate({ _sum: { size: true }, _count: { id: true } }),
  ]);

  return {
    totalOrgs,
    totalUsers,
    totalTasks,
    totalAttachments: diskUsage._count.id,
    diskUsageBytes: diskUsage._sum.size ?? 0,
  };
}

export async function listOrgs() {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  const results = await Promise.all(
    orgs.map(async (org) => {
      const [activeUsers, taskCount, diskData] = await Promise.all([
        prisma.user.count({ where: { organizationId: org.id, isActive: true } }),
        prisma.task.count({ where: { user: { organizationId: org.id }, parentId: null } }),
        prisma.attachment.aggregate({
          where: { user: { organizationId: org.id } },
          _sum: { size: true },
          _count: { id: true },
        }),
      ]);

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        status: org.status,
        trialEndsAt: org.trialEndsAt.toISOString(),
        currentPeriodEnd: org.currentPeriodEnd?.toISOString() ?? null,
        stripeCustomerId: org.stripeCustomerId ?? null,
        stripeSubscriptionId: org.stripeSubscriptionId ?? null,
        createdAt: org.createdAt.toISOString(),
        totalUsers: org._count.users,
        activeUsers,
        taskCount,
        attachmentCount: diskData._count.id,
        diskUsageBytes: diskData._sum.size ?? 0,
      };
    })
  );

  return results;
}

export async function getOrg(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      users: {
        select: {
          id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!org) throw new AppError(404, 'Organización no encontrada');

  const diskData = await prisma.attachment.aggregate({
    where: { user: { organizationId: orgId } },
    _sum: { size: true },
    _count: { id: true },
  });

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    status: org.status,
    trialEndsAt: org.trialEndsAt.toISOString(),
    currentPeriodEnd: org.currentPeriodEnd?.toISOString() ?? null,
    stripeCustomerId: org.stripeCustomerId ?? null,
    stripeSubscriptionId: org.stripeSubscriptionId ?? null,
    createdAt: org.createdAt.toISOString(),
    taskCount: org._count.tasks,
    attachmentCount: diskData._count.id,
    diskUsageBytes: diskData._sum.size ?? 0,
    users: org.users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}

export async function updateOrgStatus(
  orgId: string,
  data: { status?: string; plan?: string; trialEndsAt?: string }
) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new AppError(404, 'Organización no encontrada');

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...(data.status && { status: data.status as any }),
      ...(data.plan && { plan: data.plan as any }),
      ...(data.trialEndsAt && { trialEndsAt: new Date(data.trialEndsAt) }),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    plan: updated.plan,
    status: updated.status,
    trialEndsAt: updated.trialEndsAt.toISOString(),
  };
}
