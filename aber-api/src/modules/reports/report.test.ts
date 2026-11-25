import { randomBytes, randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAuthenticate } from '../../middlewares/authenticate';
import { errorHandler } from '../../middlewares/errorHandler';
import type { ReportRepository } from './report.repository';
import { createReportRouter } from './report.routes';
import { createReportService } from './report.service';

const secret = randomBytes(32).toString('hex');
const company = randomUUID();
const myBranch = randomUUID();
const otherBranch = randomUUID();
const calls: { branchId: string; date: string }[] = [];

const repo: ReportRepository = {
  findBranchName: (_c, id) =>
    Promise.resolve(id === myBranch || id === otherBranch ? 'فرع' : undefined),
  branchDaily: (_c, branchId, date) => {
    calls.push({ branchId, date });
    return Promise.resolve({
      shipmentsCount: 2,
      totalWeightKg: 10,
      totalPrice: 50,
      totalCod: 20,
      byStatus: { received: 2 },
    });
  },
};

const app = (): express.Express => {
  const a = express();
  a.use(express.json());
  a.use(
    '/api/reports',
    createReportRouter(
      createReportService(repo, () => '2026-11-25'),
      createAuthenticate(secret),
    ),
  );
  a.use(errorHandler);
  return a;
};
const auth = (role: string, branchId: string | null): string =>
  `Bearer ${jwt.sign({ role, companyId: company, branchId }, secret, { subject: randomUUID() })}`;
const get = (token: string, qs = '') =>
  request(app()).get(`/api/reports/branch-daily${qs}`).set('Authorization', token);

describe('/api/reports/branch-daily', () => {
  it('requires a token and a staff or admin role', async () => {
    expect((await request(app()).get('/api/reports/branch-daily')).status).toBe(401);
    expect((await get(auth('line_driver', null))).status).toBe(403);
  });

  it('gives branch staff their own branch for today by default', async () => {
    const res = await get(auth('branch_staff', myBranch));
    expect(res.status).toBe(200);
    expect(calls.at(-1)).toEqual({ branchId: myBranch, date: '2026-11-25' });
  });

  it('refuses branch staff asking for another branch', async () => {
    expect((await get(auth('branch_staff', myBranch), `?branchId=${otherBranch}`)).status).toBe(
      403,
    );
  });

  it('lets a company admin choose a branch and a date', async () => {
    const res = await get(auth('company_admin', null), `?branchId=${otherBranch}&date=2026-11-01`);
    expect(res.status).toBe(200);
    expect(calls.at(-1)).toEqual({ branchId: otherBranch, date: '2026-11-01' });
  });

  it('asks a company admin without a branch to choose one, and rejects bad input', async () => {
    expect((await get(auth('company_admin', null))).status).toBe(400);
    expect((await get(auth('company_admin', null), '?date=nope')).status).toBe(400);
    expect((await get(auth('company_admin', null), `?branchId=${randomUUID()}`)).status).toBe(404);
  });
});
