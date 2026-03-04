import { Router } from 'express';
import * as ctrl from './tags.controller';
import { authenticate, validate } from '../../middleware';
import { createTagSchema, updateTagSchema } from '@todo-list-pro/shared';
import { asyncHandler } from '../../shared';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(ctrl.handleGetAll));
router.post('/', validate(createTagSchema), asyncHandler(ctrl.handleCreate));
router.put('/:id', validate(updateTagSchema), asyncHandler(ctrl.handleUpdate));
router.delete('/:id', asyncHandler(ctrl.handleRemove));

export { router as tagsRoutes };
