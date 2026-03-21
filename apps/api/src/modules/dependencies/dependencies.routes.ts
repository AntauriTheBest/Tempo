import { Router } from 'express';
import { authenticate } from '../../middleware';
import { asyncHandler } from '../../shared';
import * as ctrl from './dependencies.controller';

const router = Router();
router.use(authenticate);

// All under /api/tasks/:id/dependencies
router.get('/:id/dependencies', asyncHandler(ctrl.handleGetDependencies));
router.post('/:id/dependencies', asyncHandler(ctrl.handleAddDependency));
router.delete('/:id/dependencies/:dependsOnId', asyncHandler(ctrl.handleRemoveDependency));

export { router as dependenciesRoutes };
