import { randomBytes, randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAuthenticate } from '../../middlewares/authenticate';
import { errorHandler } from '../../middlewares/errorHandler';
import type { BranchRepository } from './branch.repository';
import { createBranchRouter } from './branch.routes';
import { createBranchService } from './branch.service';

const secret = randomBytes(32).toString('hex');
const companyA = randomUUID();
const calls: string[] = [];
const repo: BranchRepository = {
  listByCompany: (companyId) => {
    calls.push(companyId);
    return Promise.resolve([
      {
        id: randomUUID(),
        name: 'Main',
        governorateCode: 'DAM',
        governorateName: 'دمشق',
        address: null,
      },
    ]);
  },
};

const app = (): express.Express => {
  const a = express();
  a.use('/api/branches', createBranchRouter(createBranchService(repo), createAuthenticate(secret)));
  a.use(errorHandler);
  return a;
};
const token = (role: string, companyId: string | null): string =>
  jwt.sign({ role, companyId, branchId: null }, secret, { subject: randomUUID() });

describe('GET /api/branches', () => {
  it('requires a token', async () => {
    expect((await request(app()).get('/api/branches')).status).toBe(401);
  });
  it('returns only the company of the caller', async () => {
    const res = await request(app())
      .get('/api/branches')
      .set('Authorization', `Bearer ${token('branch_staff', companyA)}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(calls.at(-1)).toBe(companyA);
  });
  it('refuses a user without a company and a customer', async () => {
    const noCompany = await request(app())
      .get('/api/branches')
      .set('Authorization', `Bearer ${token('company_admin', null)}`);
    expect(noCompany.status).toBe(403);
    const customer = await request(app())
      .get('/api/branches')
      .set('Authorization', `Bearer ${token('customer', companyA)}`);
    expect(customer.status).toBe(403);
  });
});
