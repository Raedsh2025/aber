import type { Request, Response } from 'express';
import type { LoginBody, RegisterBody } from './auth.schema';
import type { AuthService } from './auth.service';

const HTTP_CREATED = 201;

// Controller: reads the request and writes the response. No business logic.
export function createAuthController(service: AuthService) {
  return {
    async login(req: Request, res: Response): Promise<void> {
      const { identifier, password } = req.body as LoginBody;
      res.json({ data: await service.login(identifier, password) });
    },
    async register(req: Request, res: Response): Promise<void> {
      res.status(HTTP_CREATED).json({ data: await service.register(req.body as RegisterBody) });
    },
  };
}
