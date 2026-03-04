import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { authenticate } from '../../middleware';
import { asyncHandler } from '../../shared';
import { env } from '../../config';
import * as attachmentsService from './attachments.service';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

router.use(authenticate);

// GET /api/tasks/:taskId/attachments
router.get(
  '/:taskId/attachments',
  asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const user = (req as any).user;
    const attachments = await attachmentsService.getByTask(user.userId, taskId, user.role);
    res.json({ success: true, data: attachments });
  })
);

// POST /api/tasks/:taskId/attachments
router.post(
  '/:taskId/attachments',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const user = (req as any).user;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
      return;
    }

    const attachment = await attachmentsService.upload(user.userId, taskId, req.file, user.role);
    res.status(201).json({ success: true, data: attachment });
  })
);

// DELETE /api/tasks/:taskId/attachments/:id
router.delete(
  '/:taskId/attachments/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;
    await attachmentsService.remove(user.userId, id, user.role);
    res.json({ success: true, message: 'Adjunto eliminado' });
  })
);

export { router as attachmentsRoutes };
