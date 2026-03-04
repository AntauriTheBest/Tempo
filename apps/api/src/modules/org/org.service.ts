import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../config';
import { AppError } from '../../middleware';

const DEFAULT_CATEGORIES = [
  { name: 'Personal', color: '#8b5cf6', icon: 'user' },
  { name: 'Trabajo', color: '#3b82f6', icon: 'briefcase' },
  { name: 'Hogar', color: '#22c55e', icon: 'home' },
  { name: 'Finanzas', color: '#f59e0b', icon: 'dollar-sign' },
  { name: 'Salud', color: '#ef4444', icon: 'heart' },
];

const DEFAULT_LISTS = [
  { name: 'Inbox', color: '#6366f1', icon: 'inbox', isPinned: true },
  { name: 'Hoy', color: '#f59e0b', icon: 'sun', isPinned: true },
  { name: 'Próximos', color: '#3b82f6', icon: 'calendar', isPinned: false },
];

export async function getOrg(organizationId: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new AppError(404, 'Organización no encontrada');
  return {
    ...org,
    trialEndsAt: org.trialEndsAt.toISOString(),
    currentPeriodEnd: org.currentPeriodEnd?.toISOString(),
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };
}

export async function updateOrg(organizationId: string, name: string) {
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { name },
  });
  return {
    ...org,
    trialEndsAt: org.trialEndsAt.toISOString(),
    currentPeriodEnd: org.currentPeriodEnd?.toISOString(),
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };
}

export async function listMembers(organizationId: string) {
  const users = await prisma.user.findMany({
    where: { organizationId, isActive: true },
    select: { id: true, name: true, email: true, avatar: true, phone: true, role: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  return users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
}

export async function inviteMember(
  organizationId: string,
  data: { email: string; name: string; role?: 'ADMIN' | 'USER' }
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, 'Este email ya está registrado');

  const placeholderHash = await bcrypt.hash(randomUUID(), 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: placeholderHash,
        role: data.role ?? 'USER',
        isActive: false,
        organizationId,
      },
    });

    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      await tx.category.create({
        data: { ...DEFAULT_CATEGORIES[i], userId: newUser.id, organizationId, order: i },
      });
    }

    for (let i = 0; i < DEFAULT_LISTS.length; i++) {
      await tx.taskList.create({
        data: { ...DEFAULT_LISTS[i], userId: newUser.id, organizationId, order: i },
      });
    }

    const invitationToken = randomUUID();
    await tx.invitationToken.create({
      data: {
        token: invitationToken,
        email: data.email,
        userId: newUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`[INVITATION] ${data.email} → /invite?token=${invitationToken}`);
    return newUser;
  });

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function removeMember(organizationId: string, targetUserId: string, requesterId: string) {
  if (targetUserId === requesterId) throw new AppError(400, 'No puedes eliminarte a ti mismo');

  const user = await prisma.user.findFirst({ where: { id: targetUserId, organizationId } });
  if (!user) throw new AppError(404, 'Usuario no encontrado en esta organización');

  await prisma.user.update({ where: { id: targetUserId }, data: { isActive: false } });
  await prisma.refreshToken.deleteMany({ where: { userId: targetUserId } });
}
