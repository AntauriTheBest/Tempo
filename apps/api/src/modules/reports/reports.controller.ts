import { Request, Response } from 'express';
import * as reportsService from './reports.service';

export async function handleGetPersonalStats(req: Request, res: Response) {
  const userId = req.user!.userId;
  const period = (req.query.period as string) || 'monthly';
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string) : undefined;
  const week = req.query.week ? parseInt(req.query.week as string) : undefined;

  const stats = await reportsService.getPersonalStats(userId, period, year, month, week);
  res.json({ success: true, data: stats });
}

export async function handleGetAdminStats(req: Request, res: Response) {
  const period = (req.query.period as string) || 'monthly';
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string) : undefined;
  const week = req.query.week ? parseInt(req.query.week as string) : undefined;
  const userId = req.query.userId as string | undefined;

  const stats = await reportsService.getAdminStats(period, year, month, week, userId);
  res.json({ success: true, data: stats });
}

export async function handleGetTeamDashboard(req: Request, res: Response) {
  const { organizationId } = req.user!;
  const stats = await reportsService.getTeamDashboard(organizationId);
  res.json({ success: true, data: stats });
}
