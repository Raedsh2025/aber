import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { authorize } from '../../middlewares/authorize';
import { validateBody } from '../../middlewares/validateBody';
import { asyncHandler as h } from '../../shared/asyncHandler';
import { createShipmentController } from './shipment.controller';
import { createShipmentBody, deliverBody, statusBody } from './shipment.schema';
import type { ShipmentService } from './shipment.service';

const PUBLIC_TRACK_WINDOW_MS = 60_000;
const PUBLIC_TRACK_MAX = 30;

// authenticate is injected so the router can be tested without real secrets.
export function createShipmentRouters(
  service: ShipmentService,
  authenticate: RequestHandler,
): { shipmentRouter: Router; publicRouter: Router } {
  const c = createShipmentController(service);
  const shipmentRouter = Router();
  const publicRouter = Router();

  // Public tracking needs no login but is rate limited.
  publicRouter.get(
    '/track/:trackingNumber',
    rateLimit({ windowMs: PUBLIC_TRACK_WINDOW_MS, limit: PUBLIC_TRACK_MAX }),
    h(c.trackPublic),
  );

  shipmentRouter.use(authenticate);
  const staff = authorize('branch_staff', 'company_admin');
  const anyOperator = authorize('branch_staff', 'company_admin', 'line_driver', 'system_admin');

  shipmentRouter.post('/', staff, validateBody(createShipmentBody), h(c.create));
  shipmentRouter.get('/', anyOperator, h(c.list));
  shipmentRouter.get('/by-tracking/:trackingNumber', anyOperator, h(c.getByTracking));
  shipmentRouter.patch(
    '/:id/status',
    authorize('branch_staff', 'company_admin', 'line_driver'),
    validateBody(statusBody),
    h(c.changeStatus),
  );
  shipmentRouter.post('/:id/deliver', staff, validateBody(deliverBody), h(c.deliver));

  return { shipmentRouter, publicRouter };
}
