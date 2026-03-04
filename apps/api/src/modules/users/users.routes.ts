import { Router } from 'express';
import * as ctrl from './users.controller';
import { authenticate, validate } from '../../middleware';
import { updateProfileSchema, changePasswordSchema } from '@todo-list-pro/shared';
import { asyncHandler } from '../../shared';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(ctrl.handleGetAll));
router.patch('/me', validate(updateProfileSchema), asyncHandler(ctrl.handleUpdateProfile));
router.patch('/me/password', validate(changePasswordSchema), asyncHandler(ctrl.handleChangePassword));
router.delete('/me', asyncHandler(ctrl.handleDeleteAccount));

export { router as usersRoutes };
