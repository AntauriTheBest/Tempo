import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#6366f1'),
  icon: z.string().max(50).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  icon: z.string().max(50).nullable().optional(),
});

export const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().cuid(),
        order: z.number().int().min(0),
      })
    )
    .min(1),
});
