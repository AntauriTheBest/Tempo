import { Router } from 'express';
import * as ctrl from './admin.controller';
import { authenticate, requireAdmin, validate } from '../../middleware';
import { inviteUserSchema, adminUpdateUserSchema, generateMonthlySchema } from '@todo-list-pro/shared';
import { asyncHandler } from '../../shared';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', asyncHandler(ctrl.handleGetUsers));
router.get('/users/:id', asyncHandler(ctrl.handleGetUserById));
router.post('/users/invite', validate(inviteUserSchema), asyncHandler(ctrl.handleInviteUser));
router.patch('/users/:id', validate(adminUpdateUserSchema), asyncHandler(ctrl.handleUpdateUser));
router.post('/users/:id/resend-invitation', asyncHandler(ctrl.handleResendInvitation));

router.get('/tasks', asyncHandler(ctrl.handleGetAllTasks));
router.get('/stats', asyncHandler(ctrl.handleGetStats));

// Recurrence / Igualas
router.post('/recurrence/generate', validate(generateMonthlySchema), asyncHandler(ctrl.handleGenerateMonthly));
router.get('/recurrence/report', asyncHandler(ctrl.handleGetMonthlyReport));
router.get('/recurrence/clients/:id', asyncHandler(ctrl.handleGetClientMonthly));

export { router as adminRoutes };
