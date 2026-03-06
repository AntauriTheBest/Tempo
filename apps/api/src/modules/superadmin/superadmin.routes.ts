import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../../middleware';
import { asyncHandler } from '../../shared';
import * as ctrl from './superadmin.controller';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/stats', asyncHandler(ctrl.handleGetStats));
router.get('/orgs', asyncHandler(ctrl.handleListOrgs));
router.get('/orgs/:id', asyncHandler(ctrl.handleGetOrg));
router.patch('/orgs/:id', asyncHandler(ctrl.handleUpdateOrg));

export { router as superadminRoutes };
