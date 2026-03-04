import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../../middleware';
import { asyncHandler } from '../../shared';
import * as whatsappService from './whatsapp.service';

const router = Router();

// ── All routes below require authentication + admin role ──────────────────────
router.use(authenticate, requireAdmin);

router.get(
  '/status',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: whatsappService.getStatus() });
  })
);

router.get(
  '/qr',
  asyncHandler(async (_req: Request, res: Response) => {
    const qr = whatsappService.getQr();
    if (!qr) {
      res.status(404).json({ success: false, message: 'QR no disponible' });
      return;
    }
    res.json({ success: true, data: { qr } });
  })
);

router.post(
  '/disconnect',
  asyncHandler(async (_req: Request, res: Response) => {
    await whatsappService.disconnect();
    res.json({ success: true, message: 'Desconectado correctamente' });
  })
);

router.get(
  '/settings',
  asyncHandler(async (_req: Request, res: Response) => {
    const settings = await whatsappService.getSettings();
    res.json({ success: true, data: settings });
  })
);

router.put(
  '/settings',
  asyncHandler(async (req: Request, res: Response) => {
    await whatsappService.updateSettings(req.body);
    const settings = await whatsappService.getSettings();
    res.json({ success: true, data: settings });
  })
);

export { router as whatsappRoutes };
