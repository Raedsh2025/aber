import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { errorHandler } from '../../middlewares/errorHandler';
import type { AuthRepository, UserRow } from './auth.repository';
import { createAuthRouter } from './auth.routes';
import { createAuthService } from './auth.service';

const TEST_BCRYPT_COST = 4; // low cost only to keep the tests fast
const secret = randomBytes(32).toString('hex');
const password = randomBytes(12).toString('hex');
let users: UserRow[];

// In-memory repository: these tests do not touch a real database.
const repo: AuthRepository = {
  findByEmail: (email) =>
    Promise.resolve(users.find((u) => u.email.toLowerCase() === email.toLowerCase())),
};

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  const service = createAuthService(repo, { jwtSecret: secret, jwtExpiresIn: '1h' });
  app.use('/api/auth', createAuthRouter(service));
  app.use(errorHandler);
  return app;
}

const baseUser: UserRow = {
  id: 'u1',
  fullName: 'Test Admin',
  email: 'admin@example.test',
  role: 'system_admin',
  companyId: null,
  branchId: null,
  passwordHash: '',
  isActive: true,
};

beforeAll(() => {
  const passwordHash = bcrypt.hashSync(password, TEST_BCRYPT_COST);
  users = [
    { ...baseUser, passwordHash },
    { ...baseUser, id: 'u2', email: 'off@example.test', passwordHash, isActive: false },
  ];
});

const login = (body: object) => request(buildApp()).post('/api/auth/login').send(body);

describe('POST /api/auth/login', () => {
  it('returns a token and the user without secrets', async () => {
    const res = await login({ email: 'ADMIN@example.test', password });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual({
      id: 'u1',
      fullName: 'Test Admin',
      email: 'admin@example.test',
      role: 'system_admin',
      companyId: null,
      branchId: null,
    });
    const payload = jwt.verify(res.body.data.token, secret) as jwt.JwtPayload;
    expect(payload.sub).toBe('u1');
    expect(payload.role).toBe('system_admin');
  });

  it('rejects a wrong password', async () => {
    const res = await login({ email: 'admin@example.test', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('BAD_CREDENTIALS');
  });

  it('rejects an unknown email with the same error', async () => {
    const res = await login({ email: 'nobody@example.test', password });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('BAD_CREDENTIALS');
  });

  it('rejects an inactive account', async () => {
    const res = await login({ email: 'off@example.test', password });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('BAD_CREDENTIALS');
  });

  it('rejects an invalid body with a 400', async () => {
    const res = await login({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
