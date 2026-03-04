import { Router } from 'express';
import * as ctrl from './reports.controller';
import { authenticate, requireAdmin } from '../../middleware';
import { asyncHandler } from '../../shared';

const router = Router();

router.get('/my-stats', authenticate, asyncHandler(ctrl.handleGetPersonalStats));
router.get('/admin-stats', authenticate, requireAdmin, asyncHandler(ctrl.handleGetAdminStats));

export { router as reportsRoutes };
