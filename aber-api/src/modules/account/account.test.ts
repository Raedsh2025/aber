import { randomBytes } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAuthenticate, type Role } from '../../middlewares/authenticate';
import { errorHandler } from '../../middlewares/errorHandler';
import type { AccountRepository, MyShipmentDto } from './account.repository';
import { createAccountRouter } from './account.routes';
import { createAccountService } from './account.service';

const secret = randomBytes(32).toString('hex');

const shipment: MyShipmentDto = {
  trackingNumber: 'ABR-1',
  status: 'in_transit',
  originGovernorate: 'حلب',
  destGovernorate: 'دمشق',
  createdAt: '2026-11-20T10:00:00.000Z',
};

// In-memory repository: one customer with phone 0911000001 and one shipment for it.
const repo: AccountRepository = {
  findPhoneByUserId: (userId) => Promise.resolve(userId === 'cust1' ? '0911 000 001' : null),
  listShipmentsForPhone: (phoneDigits) =>
    Promise.resolve(phoneDigits === '0911000001' ? [shipment] : []),
};

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/my', createAccountRouter(createAccountService(repo), createAuthenticate(secret)));
  app.use(errorHandler);
  return app;
}

const tokenFor = (id: string, role: Role): string =>
  jwt.sign({ role, companyId: null, branchId: null }, secret, { subject: id });

const getShipments = (token?: string) => {
  const req = request(buildApp()).get('/api/my/shipments');
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

describe('GET /api/my/shipments', () => {
  it('requires a token', async () => {
    const res = await getShipments();
    expect(res.status).toBe(401);
  });

  it('rejects every role except customer with 403', async () => {
    for (const role of ['system_admin', 'company_admin', 'branch_staff', 'line_driver'] as const) {
      const res = await getShipments(tokenFor('staff1', role));
      expect(res.status).toBe(403);
    }
  });

  it('returns the shipments whose sender or receiver phone matches the customer', async () => {
    const res = await getShipments(tokenFor('cust1', 'customer'));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([shipment]);
  });

  it('returns an empty list for a customer without a phone', async () => {
    const res = await getShipments(tokenFor('cust2', 'customer'));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
