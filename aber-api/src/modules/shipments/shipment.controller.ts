import type { Request, Response } from 'express';
import { AppError } from '../../shared/AppError';
import type { AuthUser } from '../../middlewares/authenticate';
import {
  idParam,
  listQuery,
  trackingParam,
  type CreateShipmentBody,
  type DeliverBody,
  type StatusBody,
} from './shipment.schema';
import type { ShipmentService } from './shipment.service';

// authenticate guarantees req.user on protected routes. This only narrows the type.
function currentUser(req: Request): AuthUser {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'يلزم تسجيل الدخول');
  return req.user;
}

// Controller: reads the request and writes the response. No business logic.
export function createShipmentController(service: ShipmentService) {
  return {
    async create(req: Request, res: Response): Promise<void> {
      const data = await service.create(currentUser(req), req.body as CreateShipmentBody);
      res.status(201).json({ data });
    },
    async list(req: Request, res: Response): Promise<void> {
      res.json({ data: await service.list(currentUser(req), listQuery.parse(req.query)) });
    },
    async getByTracking(req: Request, res: Response): Promise<void> {
      const tracking = trackingParam.parse(req.params.trackingNumber);
      res.json({ data: await service.getByTracking(currentUser(req), tracking) });
    },
    async changeStatus(req: Request, res: Response): Promise<void> {
      const { status, note } = req.body as StatusBody;
      const id = idParam.parse(req.params.id);
      res.json({ data: await service.changeStatus(currentUser(req), id, status, note) });
    },
    async deliver(req: Request, res: Response): Promise<void> {
      const { otp } = req.body as DeliverBody;
      const id = idParam.parse(req.params.id);
      res.json({ data: await service.deliver(currentUser(req), id, otp) });
    },
    async trackPublic(req: Request, res: Response): Promise<void> {
      const tracking = trackingParam.parse(req.params.trackingNumber);
      res.json({ data: await service.trackPublic(tracking) });
    },
  };
}
