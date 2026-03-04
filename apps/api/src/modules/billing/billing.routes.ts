import { Router, Request, Response } from 'express';
import { authenticate, checkOrgStatus } from '../../middleware';
import { asyncHandler } from '../../shared';
import * as billingService from './billing.service';
import { env } from '../../config';

const router = Router();

router.use(authenticate, checkOrgStatus);

// GET /api/billing/status
router.get(
  '/status',
  asyncHandler(async (req: Request, res: Response) => {
    const status = billingService.getBillingStatus(req.org!);
    res.json({ success: true, data: status });
  })
);

// POST /api/billing/checkout
router.post(
  '/checkout',
  asyncHandler(async (req: Request, res: Response) => {
    const frontendUrl = env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
    const result = await billingService.createCheckoutSession(req.org!, req.user!.userId, frontendUrl as string);
    res.json({ success: true, data: result });
  })
);

// POST /api/billing/portal
router.post(
  '/portal',
  asyncHandler(async (req: Request, res: Response) => {
    const frontendUrl = env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
    const result = await billingService.createPortalSession(req.org!, frontendUrl as string);
    res.json({ success: true, data: result });
  })
);

export { router as billingRoutes };
