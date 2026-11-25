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
const created: { companyId: string; name: string }[] = [];
let nameTaken = false;
const repo: BranchRepository = {
  governorateExists: (code) => Promise.resolve(code === 'DAM'),
  insert: (b) => {
    if (nameTaken) return Promise.resolve(undefined);
    created.push({ companyId: b.companyId, name: b.name });
    return Promise.resolve({
      id: randomUUID(),
      name: b.name,
      governorateCode: b.governorateCode,
      governorateName: 'دمشق',
      address: b.address,
    });
  },
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
  a.use(express.json());
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

describe('POST /api/branches', () => {
  const post = (role: string, body: object) =>
    request(app())
      .post('/api/branches')
      .set('Authorization', `Bearer ${token(role, companyA)}`)
      .send(body);

  it('lets a company admin create a branch in the own company', async () => {
    nameTaken = false;
    const res = await post('company_admin', { governorateCode: 'DAM', name: 'فرع جديد' });
    expect(res.status).toBe(201);
    expect(created.at(-1)).toEqual({ companyId: companyA, name: 'فرع جديد' });
  });
  it('refuses other roles', async () => {
    expect((await post('branch_staff', { governorateCode: 'DAM', name: 'x1' })).status).toBe(403);
  });
  it('rejects an unknown governorate and a duplicate name', async () => {
    nameTaken = false;
    expect((await post('company_admin', { governorateCode: 'ZZZ', name: 'فرع' })).status).toBe(400);
    nameTaken = true;
    expect((await post('company_admin', { governorateCode: 'DAM', name: 'فرع' })).status).toBe(409);
  });
});
