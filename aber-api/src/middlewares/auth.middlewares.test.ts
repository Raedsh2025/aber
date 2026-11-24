import { randomBytes } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from './errorHandler';
import { authorize } from './authorize';
import { createAuthenticate } from './authenticate';

// A random secret per test run: no real or hard-coded credential is involved.
const secret = randomBytes(32).toString('hex');

function buildApp(): express.Express {
  const app = express();
  app.get('/any', createAuthenticate(secret), (req, res) => {
    res.json({ data: req.user });
  });
  app.get('/admin', createAuthenticate(secret), authorize('system_admin'), (_req, res) => {
    res.json({ data: 'ok' });
  });
  app.use(errorHandler);
  return app;
}

const tokenFor = (role: string, key = secret): string =>
  jwt.sign({ role, companyId: 'c1', branchId: null }, key, { subject: 'u1', expiresIn: '1h' });

describe('authenticate', () => {
  it('rejects a request without a token', async () => {
    const res = await request(buildApp()).get('/any');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a token signed with another secret', async () => {
    const other = randomBytes(32).toString('hex');
    const res = await request(buildApp())
      .get('/any')
      .set('Authorization', `Bearer ${tokenFor('customer', other)}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });

  it('rejects an expired token', async () => {
    const expired = jwt.sign({ role: 'customer' }, secret, { subject: 'u1', expiresIn: -10 });
    const res = await request(buildApp()).get('/any').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });

  it('accepts a valid token and exposes the user', async () => {
    const res = await request(buildApp())
      .get('/any')
      .set('Authorization', `Bearer ${tokenFor('branch_staff')}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      id: 'u1',
      role: 'branch_staff',
      companyId: 'c1',
      branchId: null,
    });
  });
});

describe('authorize', () => {
  it('rejects a role that is not allowed', async () => {
    const res = await request(buildApp())
      .get('/admin')
      .set('Authorization', `Bearer ${tokenFor('line_driver')}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('allows a listed role', async () => {
    const res = await request(buildApp())
      .get('/admin')
      .set('Authorization', `Bearer ${tokenFor('system_admin')}`);
    expect(res.status).toBe(200);
  });
});
