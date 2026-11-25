import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { errorHandler } from '../../middlewares/errorHandler';
import { normalizePhone } from '../../shared/phone';
import type { AuthRepository, UserRow } from './auth.repository';
import { createAuthRouter } from './auth.routes';
import { createAuthService } from './auth.service';

const TEST_BCRYPT_COST = 4; // low cost only to keep the tests fast
const secret = randomBytes(32).toString('hex');
const password = randomBytes(12).toString('hex');
let users: UserRow[];

// In-memory repository: these tests do not touch a real database.
const repo: AuthRepository = {
  findForLogin: (identifier, phoneDigits) =>
    Promise.resolve(
      users.filter(
        (u) =>
          u.email.toLowerCase() === identifier.toLowerCase() ||
          (phoneDigits !== '' && normalizePhone(u.phone ?? '') === phoneDigits),
      ),
    ),
  emailExists: (email) =>
    Promise.resolve(users.some((u) => u.email.toLowerCase() === email.toLowerCase())),
  phoneExists: (phoneDigits) =>
    Promise.resolve(users.some((u) => normalizePhone(u.phone ?? '') === phoneDigits)),
  createCustomer: (input) => {
    const row: UserRow = {
      id: `u${users.length + 1}`,
      role: 'customer',
      companyId: null,
      branchId: null,
      isActive: true,
      ...input,
    };
    users.push(row);
    return Promise.resolve(row);
  },
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
  phone: null,
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
    { ...baseUser, id: 'u3', email: 'ph@example.test', phone: '0911000001', passwordHash },
    { ...baseUser, id: 'u4', email: 'dup1@example.test', phone: '0922000002', passwordHash },
    { ...baseUser, id: 'u5', email: 'dup2@example.test', phone: '0922 000 002', passwordHash },
  ];
});

const login = (body: object) => request(buildApp()).post('/api/auth/login').send(body);
const register = (body: object) => request(buildApp()).post('/api/auth/register').send(body);

describe('POST /api/auth/login', () => {
  it('returns a token and the user without secrets', async () => {
    const res = await login({ identifier: 'ADMIN@example.test', password });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual({
      id: 'u1',
      fullName: 'Test Admin',
      email: 'admin@example.test',
      phone: null,
      role: 'system_admin',
      companyId: null,
      branchId: null,
    });
    const payload = jwt.verify(res.body.data.token, secret) as jwt.JwtPayload;
    expect(payload.sub).toBe('u1');
    expect(payload.role).toBe('system_admin');
  });

  it('logs in with a phone number, ignoring formatting', async () => {
    const res = await login({ identifier: '0911-000 001', password });
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe('u3');
  });

  it('rejects a phone shared by two accounts with the generic error', async () => {
    const res = await login({ identifier: '0922000002', password });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('BAD_CREDENTIALS');
  });

  it('rejects a wrong password', async () => {
    const res = await login({ identifier: 'admin@example.test', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('BAD_CREDENTIALS');
  });

  it('rejects an unknown identifier with the same error', async () => {
    const res = await login({ identifier: 'nobody@example.test', password });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('BAD_CREDENTIALS');
  });

  it('rejects an inactive account', async () => {
    const res = await login({ identifier: 'off@example.test', password });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('BAD_CREDENTIALS');
  });

  it('rejects an invalid body with a 400', async () => {
    const res = await login({ password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/register', () => {
  it('creates a customer and signs them in', async () => {
    const res = await register({
      fullName: 'زبون تجريبي',
      email: 'new@example.test',
      phone: '+963 911 222 333',
      password: 'password-8-chars',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.user.companyId).toBeNull();
    expect(res.body.data.user.phone).toBe('963911222333'); // stored normalized
    expect(res.body.data.user.passwordHash).toBeUndefined();
    const payload = jwt.verify(res.body.data.token, secret) as jwt.JwtPayload;
    expect(payload.role).toBe('customer');
  });

  it('rejects a duplicate email with 409', async () => {
    const res = await register({
      fullName: 'نسخة مكررة',
      email: 'NEW@example.test',
      phone: '0955000005',
      password: 'password-8-chars',
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('rejects a duplicate phone with 409', async () => {
    const res = await register({
      fullName: 'هاتف مكرر',
      email: 'other@example.test',
      phone: '0911-000-001',
      password: 'password-8-chars',
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PHONE_TAKEN');
  });

  it('rejects a short password with 400', async () => {
    const res = await register({
      fullName: 'كلمة قصيرة',
      email: 'short@example.test',
      phone: '0955000006',
      password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('lets the new customer log in with the phone right after registering', async () => {
    const res = await login({ identifier: '963911222333', password: 'password-8-chars' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('customer');
  });
});
