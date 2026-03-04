import { Router } from 'express';
import * as ctrl from './clients.controller';
import { authenticate, requireAdmin, validate } from '../../middleware';
import { createClientSchema, updateClientSchema } from '@todo-list-pro/shared';
import { asyncHandler } from '../../shared';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(ctrl.handleGetAll));
router.get('/:id', asyncHandler(ctrl.handleGetById));
router.post('/', requireAdmin, validate(createClientSchema), asyncHandler(ctrl.handleCreate));
router.put('/:id', requireAdmin, validate(updateClientSchema), asyncHandler(ctrl.handleUpdate));
router.delete('/:id', requireAdmin, asyncHandler(ctrl.handleRemove));

export { router as clientsRoutes };
