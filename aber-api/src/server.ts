import { createApp } from './app';
import { env } from './config/env';

createApp({ corsOrigin: env.CORS_ORIGIN, isTest: env.NODE_ENV === 'test' }).listen(env.PORT, () => {
  console.log(`aber-api listening on port ${env.PORT}`);
});
