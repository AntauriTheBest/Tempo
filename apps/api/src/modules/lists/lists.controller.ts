import { Request, Response } from 'express';
import * as listsService from './lists.service';

export async function handleGetAll(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await listsService.getAll(
    req.user!.userId,
    req.user!.organizationId,
    page,
    limit
  );
  res.json({ success: true, ...result });
}

export async function handleGetById(req: Request, res: Response) {
  const list = await listsService.getById(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id
  );
  res.json({ success: true, data: list });
}

export async function handleCreate(req: Request, res: Response) {
  const list = await listsService.create(
    req.user!.userId,
    req.user!.organizationId,
    req.body
  );
  res.status(201).json({ success: true, data: list });
}

export async function handleUpdate(req: Request, res: Response) {
  const list = await listsService.update(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id,
    req.body
  );
  res.json({ success: true, data: list });
}

export async function handleRemove(req: Request, res: Response) {
  await listsService.remove(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id
  );
  res.status(204).send();
}

export async function handleTogglePin(req: Request, res: Response) {
  const list = await listsService.togglePin(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id
  );
  res.json({ success: true, data: list });
}

export async function handleReorder(req: Request, res: Response) {
  await listsService.reorder(
    req.user!.userId,
    req.user!.organizationId,
    req.body.items
  );
  res.json({ success: true, message: 'Reordered successfully' });
}
