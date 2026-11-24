import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './shared/AppError';

export interface AppConfig {
  corsOrigin: string;
  isTest: boolean;
}

// The config is passed in (not imported) so the app and its tests do not need database settings.
export function createApp(config: AppConfig): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  if (!config.isTest) app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  app.use((_req, _res, next) => {
    next(new AppError(404, 'NOT_FOUND', 'المسار غير موجود'));
  });
  app.use(errorHandler);
  return app;
}
