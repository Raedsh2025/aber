import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/AppError';
import type { Role } from './authenticate';

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'لا تملك صلاحية لتنفيذ هذا الإجراء');
    }
    next();
  };
