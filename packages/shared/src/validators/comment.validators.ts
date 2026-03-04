import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'El comentario no puede estar vacío').max(2000, 'El comentario es demasiado largo'),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'El comentario no puede estar vacío').max(2000, 'El comentario es demasiado largo'),
});
