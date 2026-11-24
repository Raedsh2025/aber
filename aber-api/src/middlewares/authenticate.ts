import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../shared/AppError';

export type Role = 'system_admin' | 'company_admin' | 'branch_staff' | 'line_driver' | 'customer';

export interface AuthUser {
  id: string;
  role: Role;
  companyId: string | null;
  branchId: string | null;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

const BEARER_PREFIX = 'Bearer ';

// The secret is injected (not read from env here) so the middleware can be tested on its own.
export function createAuthenticate(jwtSecret: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith(BEARER_PREFIX)) {
      throw new AppError(401, 'UNAUTHENTICATED', 'يلزم تسجيل الدخول');
    }
    try {
      const payload = jwt.verify(header.slice(BEARER_PREFIX.length), jwtSecret) as jwt.JwtPayload;
      req.user = {
        id: String(payload.sub),
        role: payload.role as Role,
        companyId: (payload.companyId as string | null) ?? null,
        branchId: (payload.branchId as string | null) ?? null,
      };
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'الجلسة غير صالحة أو منتهية');
    }
    next();
  };
}
