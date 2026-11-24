import type { ErrorRequestHandler } from 'express';
import { AppError } from '../shared/AppError';

const HTTP_INTERNAL_ERROR = 500;

// Single central error handler: the API always answers { code, message, details }.
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next): void => {
  if (error instanceof AppError) {
    res
      .status(error.status)
      .json({ code: error.code, message: error.message, details: error.details });
    return;
  }
  console.error(error);
  res
    .status(HTTP_INTERNAL_ERROR)
    .json({ code: 'INTERNAL_ERROR', message: 'حدث خطأ غير متوقع في الخادم' });
};
