import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './shared/AppError';

export function createApp(): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  app.use((_req, _res, next) => {
    next(new AppError(404, 'NOT_FOUND', 'المسار غير موجود'));
  });
  app.use(errorHandler);
  return app;
}
