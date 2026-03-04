import { Router } from 'express';
import * as ctrl from './categories.controller';
import { authenticate, requireAdmin, validate } from '../../middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderSchema,
} from '@todo-list-pro/shared';
import { asyncHandler } from '../../shared';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(ctrl.handleGetAll));
router.post('/', requireAdmin, validate(createCategorySchema), asyncHandler(ctrl.handleCreate));
router.patch('/reorder', requireAdmin, validate(reorderSchema), asyncHandler(ctrl.handleReorder));
router.put('/:id', requireAdmin, validate(updateCategorySchema), asyncHandler(ctrl.handleUpdate));
router.delete('/:id', requireAdmin, asyncHandler(ctrl.handleRemove));

export { router as categoriesRoutes };
