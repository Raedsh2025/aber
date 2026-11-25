import { randomBytes, randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAuthenticate } from '../../middlewares/authenticate';
import { errorHandler } from '../../middlewares/errorHandler';
import type { StatsRepository } from './stats.repository';
import { createStatsRouter } from './stats.routes';

const secret = randomBytes(32).toString('hex');
const repo: StatsRepository = {
  platform: () =>
    Promise.resolve({
      companies: { approved: 2, pending: 1 },
      users: 7,
      trips: 3,
      shipmentsTotal: 5,
      shipmentsByStatus: { received: 5 },
      totalRevenue: 1000,
    }),
};
const app = (): express.Express => {
  const a = express();
  a.use('/api/admin/stats', createStatsRouter(repo, createAuthenticate(secret)));
  a.use(errorHandler);
  return a;
};
const auth = (role: string): string =>
  `Bearer ${jwt.sign({ role, companyId: null, branchId: null }, secret, { subject: randomUUID() })}`;

describe('/api/admin/stats', () => {
  it('requires a token and the system_admin role', async () => {
    expect((await request(app()).get('/api/admin/stats')).status).toBe(401);
    const res = await request(app())
      .get('/api/admin/stats')
      .set('Authorization', auth('company_admin'));
    expect(res.status).toBe(403);
  });

  it('returns the platform numbers to the system admin', async () => {
    const res = await request(app())
      .get('/api/admin/stats')
      .set('Authorization', auth('system_admin'));
    expect(res.status).toBe(200);
    expect((res.body as { data: { users: number } }).data.users).toBe(7);
  });
});
