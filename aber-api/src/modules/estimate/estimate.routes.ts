import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AppError } from '../../shared/AppError';
import { asyncHandler } from '../../shared/asyncHandler';
import { estimateQuery } from './estimate.schema';
import type { EstimateService } from './estimate.service';

// Same limits as the public tracking endpoint.
const PUBLIC_WINDOW_MS = 60_000;
const PUBLIC_MAX = 30;

export function createEstimateRouter(service: EstimateService): Router {
  const router = Router();
  router.use(rateLimit({ windowMs: PUBLIC_WINDOW_MS, limit: PUBLIC_MAX }));

  router.get(
    '/estimate',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const query = estimateQuery.safeParse(req.query);
      if (!query.success) throw new AppError(400, 'VALIDATION_ERROR', 'بيانات التقدير غير صالحة');
      res.json({ data: await service.estimate(query.data) });
    }),
  );
  router.get(
    '/governorates',
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
      res.json({ data: await service.governorates() });
    }),
  );
  return router;
}
