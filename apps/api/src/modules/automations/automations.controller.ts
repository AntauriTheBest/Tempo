import { Request, Response } from 'express';
import * as svc from './automations.service';

export async function handleGetAll(req: Request, res: Response) {
  const { organizationId } = req.user!;
  const data = await svc.getAll(organizationId);
  res.json(data);
}

export async function handleCreate(req: Request, res: Response) {
  const { organizationId, userId } = req.user!;
  const automation = await svc.create(organizationId, userId, req.body);
  res.status(201).json(automation);
}

export async function handleUpdate(req: Request, res: Response) {
  const { organizationId } = req.user!;
  const id = req.params['id'] as string;
  const automation = await svc.update(organizationId, id, req.body);
  res.json(automation);
}

export async function handleRemove(req: Request, res: Response) {
  const { organizationId } = req.user!;
  const id = req.params['id'] as string;
  await svc.remove(organizationId, id);
  res.status(204).send();
}
