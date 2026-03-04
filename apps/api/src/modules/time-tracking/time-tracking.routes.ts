import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { createTimeEntrySchema, updateEstimatedTimeSchema } from '@todo-list-pro/shared';
import * as ctrl from './time-tracking.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate(createTimeEntrySchema), asyncHandler(ctrl.handleCreate));
router.get('/task/:taskId', asyncHandler(ctrl.handleGetByTask));
router.patch('/task/:taskId/estimate', validate(updateEstimatedTimeSchema), asyncHandler(ctrl.handleUpdateEstimatedTime));
router.delete('/:id', asyncHandler(ctrl.handleDelete));

export { router as timeTrackingRoutes };
