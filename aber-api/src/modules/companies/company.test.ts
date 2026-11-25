import { randomBytes, randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAuthenticate } from '../../middlewares/authenticate';
import { errorHandler } from '../../middlewares/errorHandler';
import type { CompanyDto, CompanyRepository } from './company.repository';
import { createCompanyRouter } from './company.routes';
import { createCompanyService } from './company.service';

const secret = randomBytes(32).toString('hex');
const known = randomUUID();
const company = (status: CompanyDto['status']): CompanyDto => ({
  id: known,
  name: 'شركة',
  phone: null,
  status,
  createdAt: new Date().toISOString(),
});

const repo: CompanyRepository = {
  list: () => Promise.resolve([company('pending')]),
  updateStatus: (id, status) => Promise.resolve(id === known ? company(status) : undefined),
};

const app = (): express.Express => {
  const a = express();
  a.use(express.json());
  a.use(
    '/api/admin/companies',
    createCompanyRouter(createCompanyService(repo), createAuthenticate(secret)),
  );
  a.use(errorHandler);
  return a;
};
const auth = (role: string): string =>
  `Bearer ${jwt.sign({ role, companyId: null, branchId: null }, secret, { subject: randomUUID() })}`;

describe('/api/admin/companies', () => {
  it('requires a token and the system_admin role', async () => {
    expect((await request(app()).get('/api/admin/companies')).status).toBe(401);
    const res = await request(app())
      .get('/api/admin/companies')
      .set('Authorization', auth('company_admin'));
    expect(res.status).toBe(403);
  });

  it('lists companies for the system admin', async () => {
    const res = await request(app())
      .get('/api/admin/companies')
      .set('Authorization', auth('system_admin'));
    expect(res.status).toBe(200);
    expect((res.body as { data: unknown[] }).data).toHaveLength(1);
  });

  it('updates the status, validates input and reports unknown companies', async () => {
    const patch = (id: string, body: object) =>
      request(app())
        .patch(`/api/admin/companies/${id}/status`)
        .set('Authorization', auth('system_admin'))
        .send(body);
    const ok = await patch(known, { status: 'approved' });
    expect(ok.status).toBe(200);
    expect((ok.body as { data: { status: string } }).data.status).toBe('approved');
    expect((await patch(known, { status: 'bogus' })).status).toBe(400);
    expect((await patch('not-a-uuid', { status: 'approved' })).status).toBe(400);
    expect((await patch(randomUUID(), { status: 'approved' })).status).toBe(404);
  });
});
