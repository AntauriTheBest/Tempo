import { Router } from 'express';
import * as ctrl from './lists.controller';
import { authenticate, validate } from '../../middleware';
import {
  createListSchema,
  updateListSchema,
  reorderSchema,
} from '@todo-list-pro/shared';
import { asyncHandler } from '../../shared';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(ctrl.handleGetAll));
router.post('/', validate(createListSchema), asyncHandler(ctrl.handleCreate));
router.patch('/reorder', validate(reorderSchema), asyncHandler(ctrl.handleReorder));
router.get('/:id', asyncHandler(ctrl.handleGetById));
router.put('/:id', validate(updateListSchema), asyncHandler(ctrl.handleUpdate));
router.delete('/:id', asyncHandler(ctrl.handleRemove));
router.patch('/:id/pin', asyncHandler(ctrl.handleTogglePin));

export { router as listsRoutes };
