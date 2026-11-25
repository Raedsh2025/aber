import { Router, type Request, type RequestHandler, type Response } from 'express';
import { authorize } from '../../middlewares/authorize';
import { AppError } from '../../shared/AppError';
import { asyncHandler } from '../../shared/asyncHandler';
import { branchDailyQuery } from './report.schema';
import type { ReportService } from './report.service';

export function createReportRouter(service: ReportService, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate);

  router.get(
    '/branch-daily',
    authorize('branch_staff', 'company_admin'),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'يلزم تسجيل الدخول');
      const query = branchDailyQuery.safeParse(req.query);
      if (!query.success) throw new AppError(400, 'VALIDATION_ERROR', 'بيانات غير صالحة');
      res.json({ data: await service.branchDaily(req.user, query.data) });
    }),
  );
  return router;
}
