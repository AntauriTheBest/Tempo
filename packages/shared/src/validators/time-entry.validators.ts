import { z } from 'zod';

export const createTimeEntrySchema = z.object({
  taskId: z.string().cuid(),
  type: z.enum(['POMODORO', 'MANUAL']).default('POMODORO'),
  durationMinutes: z.number().int().min(1).max(480),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
});

export const updateEstimatedTimeSchema = z.object({
  estimatedTimeMinutes: z.number().int().min(0).max(9999).nullable(),
});
