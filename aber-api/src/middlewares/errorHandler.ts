import type { ErrorRequestHandler } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from '../shared/AppError';

const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;

// Single central error handler: the API always answers { code, message, details }.
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next): void => {
  if (error instanceof ZodError) {
    res.status(HTTP_BAD_REQUEST).json({
      code: 'VALIDATION_ERROR',
      message: 'بيانات غير صالحة',
      details: z.flattenError(error).fieldErrors,
    });
    return;
  }
  if (error instanceof AppError) {
    res
      .status(error.status)
      .json({ code: error.code, message: error.message, details: error.details });
    return;
  }
  // Internal error details are never sent to the client.
  console.error(error);
  res.status(HTTP_INTERNAL_ERROR).json({ code: 'INTERNAL', message: 'خطأ داخلي في الخادم' });
};
