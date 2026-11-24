import { createApp } from './app';
import { env } from './config/env';
import { pool } from './db/pool';
import { createAuthRepository } from './modules/auth/auth.repository';
import { createAuthRouter } from './modules/auth/auth.routes';
import { createAuthService } from './modules/auth/auth.service';

// Composition root: the only place where real implementations are wired together.
const authService = createAuthService(createAuthRepository(pool), {
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
});

createApp(
  { corsOrigin: env.CORS_ORIGIN, isTest: env.NODE_ENV === 'test' },
  { authRouter: createAuthRouter(authService) },
).listen(env.PORT, () => {
  console.log(`aber-api listening on port ${env.PORT}`);
});
