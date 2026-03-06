import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env, prisma } from '../config';
import { AppError } from './error-handler';
import type { JwtPayload } from '@todo-list-pro/shared';
import type { Organization } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      org?: Organization;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Access token required');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired access token');
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new AppError(403, 'Admin access required');
  }
  next();
}

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || !env.SUPERADMIN_EMAIL || req.user.email !== env.SUPERADMIN_EMAIL) {
    throw new AppError(403, 'Superadmin access required');
  }
  next();
}

export async function checkOrgStatus(req: Request, _res: Response, next: NextFunction) {
  const { organizationId } = req.user!;

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new AppError(404, 'Organización no encontrada');

  // Auto-suspender si el trial expiró
  if (org.status === 'TRIALING' && org.trialEndsAt < new Date()) {
    await prisma.organization.update({ where: { id: organizationId }, data: { status: 'SUSPENDED' } });
    throw new AppError(402, 'Tu periodo de prueba ha expirado. Actualiza tu plan para continuar.');
  }

  if (org.status === 'SUSPENDED' || org.status === 'CANCELLED') {
    throw new AppError(402, 'Cuenta suspendida. Actualiza tu plan para continuar.');
  }

  req.org = org;
  next();
}
