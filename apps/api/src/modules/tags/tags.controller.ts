import { Request, Response } from 'express';
import * as tagsService from './tags.service';

export async function handleGetAll(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await tagsService.getAll(
    req.user!.userId,
    req.user!.organizationId,
    page,
    limit
  );
  res.json({ success: true, ...result });
}

export async function handleCreate(req: Request, res: Response) {
  const tag = await tagsService.create(
    req.user!.userId,
    req.user!.organizationId,
    req.body
  );
  res.status(201).json({ success: true, data: tag });
}

export async function handleUpdate(req: Request, res: Response) {
  const tag = await tagsService.update(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id,
    req.body
  );
  res.json({ success: true, data: tag });
}

export async function handleRemove(req: Request, res: Response) {
  await tagsService.remove(
    req.user!.userId,
    req.user!.organizationId,
    req.params.id
  );
  res.status(204).send();
}
