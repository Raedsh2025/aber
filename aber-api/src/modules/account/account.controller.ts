import type { Request, Response } from 'express';
import { AppError } from '../../shared/AppError';
import type { AccountService } from './account.service';

// Controller: reads the request and writes the response. No business logic.
export function createAccountController(service: AccountService) {
  return {
    async myShipments(req: Request, res: Response): Promise<void> {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'يلزم تسجيل الدخول');
      res.json({ data: await service.myShipments(req.user.id) });
    },
  };
}
