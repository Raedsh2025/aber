import { Router, type Request, type RequestHandler, type Response } from 'express';
import { authorize } from '../../middlewares/authorize';
import { validateBody } from '../../middlewares/validateBody';
import { createBranchBody, type CreateBranchBody } from './branch.schema';
import { AppError } from '../../shared/AppError';
import { asyncHandler } from '../../shared/asyncHandler';
import type { BranchService } from './branch.service';

// authenticate is injected so the router can be tested without real secrets.
export function createBranchRouter(service: BranchService, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate);

  router.get(
    '/',
    authorize('branch_staff', 'company_admin', 'line_driver'),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'يلزم تسجيل الدخول');
      res.json({ data: await service.list(req.user) });
    }),
  );
  router.post(
    '/',
    authorize('company_admin'),
    validateBody(createBranchBody),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'يلزم تسجيل الدخول');
      res.status(201).json({ data: await service.create(req.user, req.body as CreateBranchBody) });
    }),
  );
  return router;
}
