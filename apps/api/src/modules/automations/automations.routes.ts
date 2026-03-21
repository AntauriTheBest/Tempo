import { Router } from 'express';
import { authenticate } from '../../middleware';
import { asyncHandler } from '../../shared';
import * as ctrl from './automations.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.handleGetAll));
router.post('/', asyncHandler(ctrl.handleCreate));
router.put('/:id', asyncHandler(ctrl.handleUpdate));
router.delete('/:id', asyncHandler(ctrl.handleRemove));

export { router as automationsRoutes };
