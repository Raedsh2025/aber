import { Router, type RequestHandler } from 'express';
import { authorize } from '../../middlewares/authorize';
import { validateBody } from '../../middlewares/validateBody';
import { asyncHandler as h } from '../../shared/asyncHandler';
import { createTripController } from './trip.controller';
import { assignBody, createTripBody, scanBody, tripStatusBody } from './trip.schema';
import type { TripService } from './trip.service';

// authenticate is injected so the router can be tested without real secrets.
export function createTripRouter(service: TripService, authenticate: RequestHandler): Router {
  const c = createTripController(service);
  const router = Router();
  router.use(authenticate);

  const manager = authorize('company_admin');
  const staff = authorize('branch_staff', 'company_admin');
  const field = authorize('branch_staff', 'company_admin', 'line_driver');

  router.post('/', manager, validateBody(createTripBody), h(c.create));
  router.get('/', field, h(c.list));
  // "/suggest" must be declared before "/:id" routes.
  router.get('/suggest', staff, h(c.suggest));
  router.get('/:id/manifest', field, h(c.manifest));
  router.post('/:id/assign', staff, validateBody(assignBody), h(c.assign));
  router.post('/:id/scan', field, validateBody(scanBody), h(c.scan));
  router.patch('/:id/status', field, validateBody(tripStatusBody), h(c.changeStatus));
  return router;
}
