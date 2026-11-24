import cors from 'cors';
import express, { type Express, type Router } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './shared/AppError';

const JSON_BODY_LIMIT = '100kb';

export interface AppConfig {
  corsOrigin: string;
  isTest: boolean;
}

export interface AppRouters {
  authRouter: Router;
  publicRouter: Router;
  shipmentRouter: Router;
}

// Config and routers are passed in (not imported) so the app and its tests do not need
// database settings. server.ts wires the real implementations.
export function createApp(config: AppConfig, routers: AppRouters): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin.split(',') }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  if (!config.isTest) app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  app.use('/api/auth', routers.authRouter);
  app.use('/api/public', routers.publicRouter);
  app.use('/api/shipments', routers.shipmentRouter);

  app.use((_req, _res, next) => {
    next(new AppError(404, 'NOT_FOUND', 'المسار غير موجود'));
  });
  app.use(errorHandler);
  return app;
}
