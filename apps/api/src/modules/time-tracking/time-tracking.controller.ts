import { Request, Response } from 'express';
import * as service from './time-tracking.service';

export async function handleCreate(req: Request, res: Response) {
  const entry = await service.createTimeEntry(
    req.user!.userId,
    req.body,
    req.user!.role
  );
  res.status(201).json({ success: true, data: entry });
}

export async function handleGetByTask(req: Request, res: Response) {
  const result = await service.getByTask(
    req.user!.userId,
    req.params.taskId,
    req.user!.role
  );
  res.json({ success: true, data: result });
}

export async function handleDelete(req: Request, res: Response) {
  await service.deleteTimeEntry(
    req.user!.userId,
    req.params.id,
    req.user!.role
  );
  res.status(204).send();
}

export async function handleUpdateEstimatedTime(req: Request, res: Response) {
  const result = await service.updateEstimatedTime(
    req.user!.userId,
    req.params.taskId,
    req.body.estimatedTimeMinutes,
    req.user!.role
  );
  res.json({ success: true, data: result });
}
