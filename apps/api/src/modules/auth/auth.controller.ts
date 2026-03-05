import { Request, Response } from 'express';
import * as authService from './auth.service';

export async function handleRegister(req: Request, res: Response) {
  const { orgName, name, email, password } = req.body;
  const result = await authService.register(orgName, name, email, password);
  res.status(201).json({ success: true, data: result });
}

export async function handleLogin(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json({ success: true, data: result });
}

export async function handleRefresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  res.json({ success: true, data: result });
}

export async function handleLogout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await authService.logout(refreshToken);
  }
  res.status(204).send();
}

export async function handleGetMe(req: Request, res: Response) {
  const user = await authService.getProfile(req.user!.userId);
  res.json({ success: true, data: user });
}

export async function handleSetPassword(req: Request, res: Response) {
  const { token, password } = req.body;
  const result = await authService.setPasswordFromInvitation(token, password);
  res.json({ success: true, data: result });
}

export async function handleForgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  await authService.forgotPassword(email);
  // Always return success to not reveal if email exists
  res.json({
    success: true,
    message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.',
  });
}

export async function handleResetPassword(req: Request, res: Response) {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);
  res.json({ success: true, data: result });
}

export async function handleVerifyEmail(req: Request, res: Response) {
  const token = req.query.token as string;
  if (!token) {
    res.status(400).json({ success: false, message: 'Token requerido' });
    return;
  }
  const result = await authService.verifyEmail(token);
  res.json({ success: true, data: result });
}
