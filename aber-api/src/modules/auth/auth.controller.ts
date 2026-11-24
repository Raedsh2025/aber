import type { Request, Response } from 'express';
import type { LoginBody } from './auth.schema';
import type { AuthService } from './auth.service';

// Controller: reads the request and writes the response. No business logic.
export function createAuthController(service: AuthService) {
  return {
    async login(req: Request, res: Response): Promise<void> {
      const { email, password } = req.body as LoginBody;
      res.json({ data: await service.login(email, password) });
    },
  };
}
