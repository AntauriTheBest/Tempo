import { z } from 'zod';

const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val);
const emptyToNull = (val: unknown) => (val === '' ? null : val);

export const createClientSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#10b981'),
  contactName: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  contactEmail: z.preprocess(emptyToUndefined, z.string().email().max(200).optional()),
  contactPhone: z.preprocess(emptyToUndefined, z.string().max(50).optional()),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  contactName: z.preprocess(emptyToNull, z.string().max(200).nullable().optional()),
  contactEmail: z.preprocess(emptyToNull, z.string().email().max(200).nullable().optional()),
  contactPhone: z.preprocess(emptyToNull, z.string().max(50).nullable().optional()),
});
