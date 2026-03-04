import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin, checkOrgStatus } from '../../middleware';
import { asyncHandler } from '../../shared';
import * as orgService from './org.service';

const router = Router();

router.use(authenticate, checkOrgStatus);

// GET /api/org — info de la organización
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const org = await orgService.getOrg(req.user!.organizationId);
    res.json({ success: true, data: org });
  })
);

// PUT /api/org — actualizar nombre
router.put(
  '/',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ success: false, message: 'El nombre es requerido' });
      return;
    }
    const org = await orgService.updateOrg(req.user!.organizationId, name.trim());
    res.json({ success: true, data: org });
  })
);

// GET /api/org/members
router.get(
  '/members',
  asyncHandler(async (req: Request, res: Response) => {
    const members = await orgService.listMembers(req.user!.organizationId);
    res.json({ success: true, data: members });
  })
);

// POST /api/org/members/invite
router.post(
  '/members/invite',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, role } = req.body;
    const member = await orgService.inviteMember(req.user!.organizationId, { email, name, role });
    res.status(201).json({ success: true, data: member });
  })
);

// DELETE /api/org/members/:id
router.delete(
  '/members/:id',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    await orgService.removeMember(req.user!.organizationId, req.params.id, req.user!.userId);
    res.json({ success: true, message: 'Miembro eliminado' });
  })
);

export { router as orgRoutes };
