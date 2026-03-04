import { Request, Response } from 'express';
import * as usersService from './users.service';

export async function handleGetAll(req: Request, res: Response) {
  const users = await usersService.getAll(req.user!.organizationId);
  res.json({ success: true, data: users });
}

export async function handleUpdateProfile(req: Request, res: Response) {
  const user = await usersService.updateProfile(req.user!.userId, req.body);
  res.json({ success: true, data: user });
}

export async function handleChangePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body;
  await usersService.changePassword(
    req.user!.userId,
    currentPassword,
    newPassword
  );
  res.json({ success: true, message: 'Password changed successfully' });
}

export async function handleDeleteAccount(req: Request, res: Response) {
  await usersService.deleteAccount(req.user!.userId);
  res.status(204).send();
}
