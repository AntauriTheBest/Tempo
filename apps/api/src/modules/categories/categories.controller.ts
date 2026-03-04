import { Request, Response } from 'express';
import * as categoriesService from './categories.service';

export async function handleGetAll(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await categoriesService.getAll(
    req.user!.userId,
    req.user!.organizationId,
    page,
    limit
  );
  res.json({ success: true, ...result });
}

export async function handleCreate(req: Request, res: Response) {
  const category = await categoriesService.create(
    req.user!.userId,
    req.user!.organizationId,
    req.body
  );
  res.status(201).json({ success: true, data: category });
}

export async function handleUpdate(req: Request, res: Response) {
  const category = await categoriesService.update(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id,
    req.body
  );
  res.json({ success: true, data: category });
}

export async function handleRemove(req: Request, res: Response) {
  await categoriesService.remove(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id
  );
  res.status(204).send();
}

export async function handleReorder(req: Request, res: Response) {
  await categoriesService.reorder(
    req.user!.userId,
    req.user!.organizationId,
    req.body.items
  );
  res.json({ success: true, message: 'Reordered successfully' });
}
