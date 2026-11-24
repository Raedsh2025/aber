import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Makes sure errors from async handlers reach the central error handler.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
