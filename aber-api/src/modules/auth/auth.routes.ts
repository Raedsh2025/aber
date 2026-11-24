import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody } from '../../middlewares/validateBody';
import { asyncHandler } from '../../shared/asyncHandler';
import { createAuthController } from './auth.controller';
import { loginBody } from './auth.schema';
import type { AuthService } from './auth.service';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 20;

export function createAuthRouter(service: AuthService): Router {
  const controller = createAuthController(service);
  const router = Router();

  // Protects against password guessing.
  const loginLimiter = rateLimit({ windowMs: LOGIN_WINDOW_MS, limit: LOGIN_MAX_ATTEMPTS });

  router.post('/login', loginLimiter, validateBody(loginBody), asyncHandler(controller.login));
  return router;
}
