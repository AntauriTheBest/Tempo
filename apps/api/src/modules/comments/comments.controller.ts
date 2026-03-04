import { Request, Response } from 'express';
import * as commentsService from './comments.service';

export async function handleGetByTask(req: Request, res: Response) {
  const comments = await commentsService.getCommentsByTask(
    req.user!.userId,
    req.params.taskId,
    req.user!.role
  );
  res.json({ success: true, data: comments });
}

export async function handleCreate(req: Request, res: Response) {
  const comment = await commentsService.createComment(
    req.user!.userId,
    req.params.taskId,
    req.body,
    req.user!.role
  );
  res.status(201).json({ success: true, data: comment });
}

export async function handleUpdate(req: Request, res: Response) {
  const comment = await commentsService.updateComment(
    req.user!.userId,
    req.params.id,
    req.body,
    req.user!.role
  );
  res.json({ success: true, data: comment });
}

export async function handleDelete(req: Request, res: Response) {
  await commentsService.deleteComment(req.user!.userId, req.params.id, req.user!.role);
  res.status(204).send();
}
