import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { updateCommentSchema } from '@todo-list-pro/shared';
import * as controller from './comments.controller';

const router = Router();

// Individual comment operations
router.put(
  '/comments/:id',
  authenticate,
  validate(updateCommentSchema, 'body'),
  asyncHandler(controller.handleUpdate)
);

router.delete('/comments/:id', authenticate, asyncHandler(controller.handleDelete));

export default router;
