import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  avatar: z.string().url().nullable().optional(),
  phone: z.string().regex(/^\d{7,15}$/, 'Formato inválido (solo dígitos, 7-15 caracteres)').nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});
