import { Request, Response } from 'express';
import * as tasksService from './tasks.service';

export async function handleGetAll(req: Request, res: Response) {
  const result = await tasksService.getAll(
    req.user!.userId,
    req.user!.organizationId,
    req.query as any,
    req.user!.role
  );
  res.json({ success: true, ...result });
}

export async function handleGetById(req: Request, res: Response) {
  const task = await tasksService.getById(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id,
    req.user!.role
  );
  res.json({ success: true, data: task });
}

export async function handleCreate(req: Request, res: Response) {
  const task = await tasksService.create(
    req.user!.userId,
    req.user!.organizationId,
    req.body,
    req.user!.role
  );
  res.status(201).json({ success: true, data: task });
}

export async function handleUpdate(req: Request, res: Response) {
  const task = await tasksService.update(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id,
    req.body,
    req.user!.role
  );
  res.json({ success: true, data: task });
}

export async function handleRemove(req: Request, res: Response) {
  await tasksService.remove(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id,
    req.user!.role
  );
  res.status(204).send();
}

export async function handleUpdateStatus(req: Request, res: Response) {
  const task = await tasksService.updateStatus(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id,
    req.body.status,
    req.user!.role
  );
  res.json({ success: true, data: task });
}

export async function handleMove(req: Request, res: Response) {
  const task = await tasksService.moveTask(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id,
    req.body,
    req.user!.role
  );
  res.json({ success: true, data: task });
}

export async function handleReorder(req: Request, res: Response) {
  await tasksService.reorder(
    req.user!.userId,
    req.user!.organizationId,
    req.body.items
  );
  res.json({ success: true, message: 'Reordered successfully' });
}

export async function handleCreateSubtask(req: Request, res: Response) {
  const task = await tasksService.createSubtask(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id,
    req.body,
    req.user!.role
  );
  res.status(201).json({ success: true, data: task });
}

export async function handleDuplicate(req: Request, res: Response) {
  const task = await tasksService.duplicate(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id,
    req.user!.role
  );
  res.status(201).json({ success: true, data: task });
}

export async function handleGetGraph(req: Request, res: Response) {
  const data = await tasksService.getGraph(
    req.user!.userId,
    req.user!.organizationId,
    req.user!.role
  );
  res.json({ success: true, data });
}
