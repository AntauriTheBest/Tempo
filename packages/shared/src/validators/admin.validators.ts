import { z } from 'zod';

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2).max(100).trim(),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  isActive: z.boolean().optional(),
});
