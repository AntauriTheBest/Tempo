import { Router } from 'express';
import * as ctrl from './auth.controller';
import { authenticate, validate, authRateLimiter } from '../../middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  setPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@todo-list-pro/shared';
import { asyncHandler } from '../../shared';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), asyncHandler(ctrl.handleRegister));
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(ctrl.handleLogin));
router.post('/set-password', authRateLimiter, validate(setPasswordSchema), asyncHandler(ctrl.handleSetPassword));
router.post('/refresh', authRateLimiter, validate(refreshTokenSchema), asyncHandler(ctrl.handleRefresh));
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), asyncHandler(ctrl.handleForgotPassword));
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), asyncHandler(ctrl.handleResetPassword));
router.get('/verify-email', asyncHandler(ctrl.handleVerifyEmail));
router.post('/logout', asyncHandler(ctrl.handleLogout));
router.get('/me', authenticate, asyncHandler(ctrl.handleGetMe));

export { router as authRoutes };
