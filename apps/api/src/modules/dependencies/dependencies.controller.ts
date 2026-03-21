import { Request, Response } from 'express';
import * as svc from './dependencies.service';

export async function handleGetDependencies(req: Request, res: Response) {
  const { organizationId } = req.user!;
  const id = req.params['id'] as string;
  const data = await svc.getTaskDependencies(organizationId, id);
  res.json(data);
}

export async function handleAddDependency(req: Request, res: Response) {
  const { organizationId } = req.user!;
  const id = req.params['id'] as string;
  const { dependsOnId } = req.body;
  const dep = await svc.addDependency(organizationId, id, dependsOnId);
  res.status(201).json(dep);
}

export async function handleRemoveDependency(req: Request, res: Response) {
  const { organizationId } = req.user!;
  const id = req.params['id'] as string;
  const dependsOnId = req.params['dependsOnId'] as string;
  await svc.removeDependency(organizationId, id, dependsOnId);
  res.status(204).send();
}
