import { Router, type Request, type RequestHandler, type Response } from 'express';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../shared/asyncHandler';
import type { StatsRepository } from './stats.repository';

export function createStatsRouter(repo: StatsRepository, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate, authorize('system_admin'));

  router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
      res.json({ data: await repo.platform() });
    }),
  );
  return router;
}
