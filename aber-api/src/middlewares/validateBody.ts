import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

// Zod errors are turned into a 400 response by errorHandler.
export const validateBody =
  (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
