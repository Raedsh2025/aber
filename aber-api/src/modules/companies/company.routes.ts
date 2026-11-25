import { Router, type RequestHandler, type Request, type Response } from 'express';
import { authorize } from '../../middlewares/authorize';
import { validateBody } from '../../middlewares/validateBody';
import { AppError } from '../../shared/AppError';
import { asyncHandler } from '../../shared/asyncHandler';
import {
  companyIdParams,
  updateCompanyStatusBody,
  type UpdateCompanyStatusBody,
} from './company.schema';
import type { CompanyService } from './company.service';

export function createCompanyRouter(service: CompanyService, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate, authorize('system_admin'));

  router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
      res.json({ data: await service.list() });
    }),
  );
  router.patch(
    '/:id/status',
    validateBody(updateCompanyStatusBody),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const params = companyIdParams.safeParse(req.params);
      if (!params.success) throw new AppError(400, 'VALIDATION_ERROR', 'معرّف الشركة غير صالح');
      const body = req.body as UpdateCompanyStatusBody;
      res.json({ data: await service.setStatus(params.data.id, body.status) });
    }),
  );
  return router;
}
