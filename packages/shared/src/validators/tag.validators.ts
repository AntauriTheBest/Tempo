import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1).max(30).trim(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#8b5cf6'),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(30).trim().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});
