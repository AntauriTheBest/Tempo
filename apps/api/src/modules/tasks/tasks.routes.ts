import { Router } from 'express';
import * as ctrl from './tasks.controller';
import { authenticate, validate } from '../../middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  taskFiltersSchema,
  updateTaskStatusSchema,
  moveTaskSchema,
  reorderSchema,
  createCommentSchema,
} from '@todo-list-pro/shared';
import { asyncHandler } from '../../shared';
import * as commentsCtrl from '../comments/comments.controller';

const router = Router();

router.use(authenticate);

// Base routes
router.get('/', validate(taskFiltersSchema, 'query'), asyncHandler(ctrl.handleGetAll));
router.post('/', validate(createTaskSchema), asyncHandler(ctrl.handleCreate));
router.patch('/reorder', validate(reorderSchema), asyncHandler(ctrl.handleReorder));

// Task-specific routes (must be before /:id to avoid conflicts)
router.get('/:taskId/comments', asyncHandler(commentsCtrl.handleGetByTask));
router.post('/:taskId/comments', validate(createCommentSchema, 'body'), asyncHandler(commentsCtrl.handleCreate));
router.patch('/:id/status', validate(updateTaskStatusSchema), asyncHandler(ctrl.handleUpdateStatus));
router.patch('/:id/move', validate(moveTaskSchema), asyncHandler(ctrl.handleMove));
router.post('/:id/subtasks', validate(createTaskSchema), asyncHandler(ctrl.handleCreateSubtask));
router.post('/:id/duplicate', asyncHandler(ctrl.handleDuplicate));

// Generic task routes (must be last)
router.get('/:id', asyncHandler(ctrl.handleGetById));
router.put('/:id', validate(updateTaskSchema), asyncHandler(ctrl.handleUpdate));
router.delete('/:id', asyncHandler(ctrl.handleRemove));

export { router as tasksRoutes };
