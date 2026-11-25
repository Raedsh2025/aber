import { Router, type Request, type RequestHandler, type Response } from 'express';
import { authorize } from '../../middlewares/authorize';
import { validateBody } from '../../middlewares/validateBody';
import { AppError } from '../../shared/AppError';
import { asyncHandler } from '../../shared/asyncHandler';
import { createStaffBody, type CreateStaffBody } from './staff.schema';
import type { StaffService } from './staff.service';

const currentUser = (req: Request): NonNullable<Request['user']> => {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'يلزم تسجيل الدخول');
  return req.user;
};

export function createStaffRouter(service: StaffService, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate, authorize('company_admin'));

  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      res.json({ data: await service.list(currentUser(req)) });
    }),
  );
  router.post(
    '/',
    validateBody(createStaffBody),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      res
        .status(201)
        .json({ data: await service.create(currentUser(req), req.body as CreateStaffBody) });
    }),
  );
  return router;
}
