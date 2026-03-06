import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma, env } from '../../config';
import { AppError } from '../../middleware';
import { sendPasswordResetEmail, sendEmailVerificationEmail } from '../../services/email.service';
import type { JwtPayload, UserRole } from '@todo-list-pro/shared';

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

function generateAccessToken(userId: string, email: string, role: UserRole, organizationId: string): string {
  return jwt.sign({ userId, email, role, organizationId } as JwtPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
}

function parseExpiry(expiry: string): Date {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);
  const value = parseInt(match[1]);
  const unit = match[2];
  const ms = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[unit]!;
  return new Date(Date.now() + value * ms);
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = randomUUID();
  const expiresAt = parseExpiry(env.JWT_REFRESH_EXPIRY);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
}

async function generateTokens(userId: string, email: string, role: UserRole, organizationId: string) {
  const accessToken = generateAccessToken(userId, email, role, organizationId);
  const refreshToken = await createRefreshToken(userId);
  return { accessToken, refreshToken };
}

function formatUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar ?? null,
    phone: user.phone ?? null,
    role: user.role,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}

function formatOrg(org: any) {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    status: org.status,
    trialEndsAt: org.trialEndsAt instanceof Date ? org.trialEndsAt.toISOString() : org.trialEndsAt,
    currentPeriodEnd: org.currentPeriodEnd
      ? org.currentPeriodEnd instanceof Date ? org.currentPeriodEnd.toISOString() : org.currentPeriodEnd
      : undefined,
    createdAt: org.createdAt instanceof Date ? org.createdAt.toISOString() : org.createdAt,
  };
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export async function register(orgName: string, name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'Este email ya está registrado');

  const baseSlug = generateSlug(orgName);
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const verificationEnabled = env.EMAIL_VERIFICATION_ENABLED;
  const verificationToken = verificationEnabled ? randomUUID() : null;
  const verificationExpiry = verificationEnabled
    ? new Date(Date.now() + 24 * 60 * 60 * 1000)
    : null;

  const { org, user } = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: orgName,
        slug,
        plan: 'TRIAL',
        status: 'TRIALING',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const user = await tx.user.create({
      data: {
        email, passwordHash, name, role: 'ADMIN', isActive: true, organizationId: org.id,
        emailVerified: !verificationEnabled,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      await tx.category.create({
        data: { ...DEFAULT_CATEGORIES[i], userId: user.id, organizationId: org.id, order: i },
      });
    }

    for (let i = 0; i < DEFAULT_LISTS.length; i++) {
      await tx.taskList.create({
        data: { ...DEFAULT_LISTS[i], userId: user.id, organizationId: org.id, order: i },
      });
    }

    return { org, user };
  });

  if (verificationEnabled && verificationToken) {
    await sendEmailVerificationEmail(user.email, verificationToken, user.name);
    return { requiresVerification: true as const, email: user.email };
  }

  const tokens = await generateTokens(user.id, user.email, user.role as UserRole, org.id);
  return { requiresVerification: false as const, user: formatUser(user), organization: formatOrg(org), tokens };
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
    include: { organization: true },
  });

  if (!user) throw new AppError(400, 'Token inválido o expirado');
  if (user.emailVerified) throw new AppError(400, 'El correo ya fue verificado');
  if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
    throw new AppError(400, 'El enlace ha expirado. Regístrate de nuevo.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpiry: null },
  });

  const tokens = await generateTokens(user.id, user.email, user.role as UserRole, user.organizationId);
  return { user: formatUser(user), organization: formatOrg(user.organization), tokens };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  if (env.EMAIL_VERIFICATION_ENABLED && !user.emailVerified) {
    throw new AppError(403, 'EMAIL_NOT_VERIFIED');
  }

  const tokens = await generateTokens(user.id, user.email, user.role as UserRole, user.organizationId);

  return {
    user: formatUser(user),
    organization: formatOrg(user.organization),
    tokens,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored) throw new AppError(401, 'Invalid refresh token');
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.deleteMany({ where: { id: stored.id } });
    throw new AppError(401, 'Refresh token expired');
  }

  await prisma.refreshToken.deleteMany({ where: { id: stored.id } });
  const tokens = await generateTokens(
    stored.user.id, stored.user.email,
    stored.user.role as UserRole, stored.user.organizationId
  );
  return { tokens };
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.delete({ where: { token: refreshToken } }).catch(() => {});
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatar: true, phone: true, role: true, createdAt: true, organizationId: true },
  });

  if (!user) throw new AppError(404, 'User not found');
  return { ...user, createdAt: user.createdAt.toISOString() };
}

export async function setPasswordFromInvitation(token: string, password: string) {
  const invitation = await prisma.invitationToken.findUnique({
    where: { token },
    include: { user: { include: { organization: true } } },
  });

  if (!invitation) throw new AppError(400, 'Invalid invitation token');
  if (invitation.usedAt) throw new AppError(400, 'Invitation token already used');
  if (invitation.expiresAt < new Date()) throw new AppError(400, 'Invitation token expired');

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    await tx.invitationToken.update({ where: { id: invitation.id }, data: { usedAt: new Date() } });
    return tx.user.update({ where: { id: invitation.userId }, data: { passwordHash, isActive: true } });
  });

  const tokens = await generateTokens(user.id, user.email, user.role as UserRole, user.organizationId);

  return {
    user: formatUser(user),
    organization: formatOrg(invitation.user.organization),
    tokens,
  };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return;

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({ data: { token, email: user.email, userId: user.id, expiresAt } });
  await sendPasswordResetEmail(user.email, token, user.name);
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { include: { organization: true } } },
  });

  if (!resetToken) throw new AppError(400, 'Token inválido o expirado');
  if (resetToken.usedAt) throw new AppError(400, 'Este enlace ya fue utilizado');
  if (resetToken.expiresAt < new Date()) throw new AppError(400, 'El enlace ha expirado. Solicita uno nuevo.');

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const user = await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } });
    return tx.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
  });

  const tokens = await generateTokens(user.id, user.email, user.role as UserRole, user.organizationId);

  return {
    user: formatUser(user),
    organization: formatOrg(resetToken.user.organization),
    tokens,
  };
}
