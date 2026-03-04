import { Request, Response } from 'express';
import * as adminService from './admin.service';

export async function handleGetUsers(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const result = await adminService.getUsers(page, limit);
  res.json({ success: true, ...result });
}

export async function handleGetUserById(req: Request, res: Response) {
  const user = await adminService.getUserById(req.params.id);
  res.json({ success: true, data: user });
}

export async function handleInviteUser(req: Request, res: Response) {
  const result = await adminService.inviteUser(req.body);
  res.status(201).json({ success: true, data: result });
}

export async function handleUpdateUser(req: Request, res: Response) {
  const result = await adminService.updateUser(req.params.id, req.body);
  res.json({ success: true, data: result });
}

export async function handleResendInvitation(req: Request, res: Response) {
  const result = await adminService.resendInvitation(req.params.id);
  res.json({ success: true, data: result });
}

export async function handleGetAllTasks(req: Request, res: Response) {
  const result = await adminService.getAllTasks({
    status: req.query.status as string,
    userId: req.query.userId as string,
    search: req.query.search as string,
    priority: req.query.priority as string,
    sortBy: req.query.sortBy as string,
    sortDir: req.query.sortDir as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 50,
  });
  res.json({ success: true, ...result });
}

export async function handleGetStats(_req: Request, res: Response) {
  const stats = await adminService.getStats();
  res.json({ success: true, data: stats });
}

export async function handleGenerateMonthly(req: Request, res: Response) {
  const { year, month } = req.body;
  const result = await adminService.generateMonthlyTasks(year, month);
  res.json({ success: true, data: result });
}

export async function handleGetMonthlyReport(req: Request, res: Response) {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
  const report = await adminService.getMonthlyReport(year, month);
  res.json({ success: true, data: report });
}

export async function handleGetClientMonthly(req: Request, res: Response) {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
  const report = await adminService.getClientMonthlyDetail(req.params.id, year, month);
  res.json({ success: true, data: report });
}
