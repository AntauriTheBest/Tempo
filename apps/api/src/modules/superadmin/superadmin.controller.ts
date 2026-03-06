import { Request, Response } from 'express';
import * as svc from './superadmin.service';

export async function handleGetStats(_req: Request, res: Response) {
  const stats = await svc.getGlobalStats();
  res.json({ success: true, data: stats });
}

export async function handleListOrgs(_req: Request, res: Response) {
  const orgs = await svc.listOrgs();
  res.json({ success: true, data: orgs });
}

export async function handleGetOrg(req: Request, res: Response) {
  const org = await svc.getOrg(req.params.id);
  res.json({ success: true, data: org });
}

export async function handleUpdateOrg(req: Request, res: Response) {
  const result = await svc.updateOrgStatus(req.params.id, req.body);
  res.json({ success: true, data: result });
}
