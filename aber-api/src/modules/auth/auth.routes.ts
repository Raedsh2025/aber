import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody } from '../../middlewares/validateBody';
import { asyncHandler } from '../../shared/asyncHandler';
import { createAuthController } from './auth.controller';
import { loginBody, registerBody } from './auth.schema';
import type { AuthService } from './auth.service';

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 20;

export function createAuthRouter(service: AuthService): Router {
  const controller = createAuthController(service);
  const router = Router();

  // Protects against password guessing and bulk account creation.
  const authLimiter = rateLimit({ windowMs: AUTH_WINDOW_MS, limit: AUTH_MAX_ATTEMPTS });

  router.post('/login', authLimiter, validateBody(loginBody), asyncHandler(controller.login));
  router.post(
    '/register',
    authLimiter,
    validateBody(registerBody),
    asyncHandler(controller.register),
  );
  return router;
}
