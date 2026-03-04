import { z } from 'zod';

export const createListSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#3b82f6'),
  icon: z.string().max(50).optional(),
  clientId: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().cuid().optional()
  ),
});

export const updateListSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  icon: z.string().max(50).nullable().optional(),
  clientId: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().cuid().nullable().optional()
  ),
});
