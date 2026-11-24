import type { Request, Response } from 'express';
import type { AuthUser } from '../../middlewares/authenticate';
import { AppError } from '../../shared/AppError';
import {
  suggestQuery,
  tripIdParam,
  tripListQuery,
  type CreateTripBody,
  type ScanBody,
} from './trip.schema';
import { assignBody, tripStatusBody } from './trip.schema';
import type { TripService } from './trip.service';

// authenticate guarantees req.user on protected routes. This only narrows the type.
function currentUser(req: Request): AuthUser {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'يلزم تسجيل الدخول');
  return req.user;
}

const tripId = (req: Request): string => tripIdParam.parse(req.params.id);

// Controller: reads the request and writes the response. No business logic.
export function createTripController(service: TripService) {
  return {
    async create(req: Request, res: Response): Promise<void> {
      res
        .status(201)
        .json({ data: await service.create(currentUser(req), req.body as CreateTripBody) });
    },
    async list(req: Request, res: Response): Promise<void> {
      res.json({ data: await service.list(currentUser(req), tripListQuery.parse(req.query)) });
    },
    async suggest(req: Request, res: Response): Promise<void> {
      res.json({ data: await service.suggest(currentUser(req), suggestQuery.parse(req.query)) });
    },
    async manifest(req: Request, res: Response): Promise<void> {
      res.json({ data: await service.manifest(currentUser(req), tripId(req)) });
    },
    async assign(req: Request, res: Response): Promise<void> {
      const { shipmentId } = assignBody.parse(req.body);
      res.json({ data: await service.assign(currentUser(req), tripId(req), shipmentId) });
    },
    async scan(req: Request, res: Response): Promise<void> {
      res.json({ data: await service.scan(currentUser(req), tripId(req), req.body as ScanBody) });
    },
    async changeStatus(req: Request, res: Response): Promise<void> {
      const { status } = tripStatusBody.parse(req.body);
      res.json({ data: await service.changeStatus(currentUser(req), tripId(req), status) });
    },
  };
}
