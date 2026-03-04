import { z } from 'zod';

export const createRecurrenceSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().int().min(1).max(12).default(1),
  dayOfMonth: z.number().int().min(1).max(28).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export const generateMonthlySchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});
