import bcrypt from 'bcrypt';
import { prisma } from '../../config';
import { AppError } from '../../middleware';

export async function getAll(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId, isActive: true },
    select: { id: true, name: true, email: true, avatar: true },
    orderBy: { name: 'asc' },
  });
}

export async function updateProfile(
  userId: string,
  data: { name?: string; avatar?: string | null; phone?: string | null }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  return { ...user, createdAt: user.createdAt.toISOString() };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError(401, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function deleteAccount(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId } });
}
