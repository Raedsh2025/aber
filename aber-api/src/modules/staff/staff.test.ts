import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAuthenticate } from '../../middlewares/authenticate';
import { errorHandler } from '../../middlewares/errorHandler';
import type { NewStaff, StaffRepository } from './staff.repository';
import { createStaffRouter } from './staff.routes';
import { createStaffService } from './staff.service';

const secret = randomBytes(32).toString('hex');
const companyA = randomUUID();
const ownBranch = randomUUID();
const otherBranch = randomUUID();
const inserted: NewStaff[] = [];
let emailTaken = false;

const repo: StaffRepository = {
  listByCompany: () => Promise.resolve([]),
  branchBelongsToCompany: (branchId) => Promise.resolve(branchId === ownBranch),
  insert: (s) => {
    if (emailTaken) return Promise.resolve(undefined);
    inserted.push(s);
    return Promise.resolve({
      id: randomUUID(),
      fullName: s.fullName,
      email: s.email,
      phone: s.phone,
      role: s.role,
      branchId: s.branchId,
      isActive: true,
    });
  },
};

const app = (): express.Express => {
  const a = express();
  a.use(express.json());
  a.use('/api/staff', createStaffRouter(createStaffService(repo), createAuthenticate(secret)));
  a.use(errorHandler);
  return a;
};
const auth = (role: string): string =>
  `Bearer ${jwt.sign({ role, companyId: companyA, branchId: null }, secret, { subject: randomUUID() })}`;
const post = (role: string, body: object) =>
  request(app()).post('/api/staff').set('Authorization', auth(role)).send(body);

const driver = {
  fullName: 'سائق',
  email: 'driver@example.com',
  password: 'a-long-password',
  role: 'line_driver',
};

describe('/api/staff', () => {
  it('is only for company admins', async () => {
    expect((await post('branch_staff', driver)).status).toBe(403);
    const list = await request(app()).get('/api/staff').set('Authorization', auth('line_driver'));
    expect(list.status).toBe(403);
  });

  it('stores a bcrypt hash, never the password, and never returns it', async () => {
    emailTaken = false;
    const res = await post('company_admin', driver);
    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toContain('a-long-password');
    const stored = inserted.at(-1);
    expect(stored?.passwordHash).not.toBe('a-long-password');
    expect(await bcrypt.compare('a-long-password', stored?.passwordHash ?? '')).toBe(true);
    expect(stored?.companyId).toBe(companyA);
  });

  it('needs a branch for branch staff and refuses a branch of another company', async () => {
    const staff = { ...driver, role: 'branch_staff', email: 'staff@example.com' };
    expect((await post('company_admin', staff)).status).toBe(400);
    expect((await post('company_admin', { ...staff, branchId: otherBranch })).status).toBe(403);
    expect((await post('company_admin', { ...staff, branchId: ownBranch })).status).toBe(201);
  });

  it('rejects a short password and reports a duplicate email', async () => {
    expect((await post('company_admin', { ...driver, password: 'short' })).status).toBe(400);
    emailTaken = true;
    expect((await post('company_admin', driver)).status).toBe(409);
  });
});
