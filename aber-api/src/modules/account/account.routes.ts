import { Router, type RequestHandler } from 'express';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../shared/asyncHandler';
import { createAccountController } from './account.controller';
import type { AccountService } from './account.service';

export function createAccountRouter(service: AccountService, authenticate: RequestHandler): Router {
  const controller = createAccountController(service);
  const router = Router();

  router.use(authenticate);
  router.get('/shipments', authorize('customer'), asyncHandler(controller.myShipments));
  return router;
}
