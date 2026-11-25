import { randomBytes, randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAuthenticate } from '../../middlewares/authenticate';
import { errorHandler } from '../../middlewares/errorHandler';
import type { VehicleRepository } from './vehicle.repository';
import { createVehicleRouter } from './vehicle.routes';
import { createVehicleService } from './vehicle.service';

const secret = randomBytes(32).toString('hex');
const companyA = randomUUID();
const seen: string[] = [];
let plateTaken = false;

const repo: VehicleRepository = {
  listByCompany: (companyId) => {
    seen.push(companyId);
    return Promise.resolve([]);
  },
  insert: (v) =>
    Promise.resolve(
      plateTaken
        ? undefined
        : {
            id: randomUUID(),
            plateNumber: v.plateNumber,
            capacityKg: v.capacityKg,
            isActive: true,
          },
    ),
};

const app = (): express.Express => {
  const a = express();
  a.use(express.json());
  a.use(
    '/api/vehicles',
    createVehicleRouter(createVehicleService(repo), createAuthenticate(secret)),
  );
  a.use(errorHandler);
  return a;
};
const auth = (role: string, companyId: string | null): string =>
  `Bearer ${jwt.sign({ role, companyId, branchId: null }, secret, { subject: randomUUID() })}`;

describe('/api/vehicles', () => {
  it('requires a token and the company_admin role', async () => {
    expect((await request(app()).get('/api/vehicles')).status).toBe(401);
    const res = await request(app())
      .get('/api/vehicles')
      .set('Authorization', auth('line_driver', companyA));
    expect(res.status).toBe(403);
  });

  it('lists only the company of the caller', async () => {
    const res = await request(app())
      .get('/api/vehicles')
      .set('Authorization', auth('company_admin', companyA));
    expect(res.status).toBe(200);
    expect(seen.at(-1)).toBe(companyA);
  });

  it('creates a vehicle, validates the body and reports a duplicate plate', async () => {
    const post = (body: object) =>
      request(app())
        .post('/api/vehicles')
        .set('Authorization', auth('company_admin', companyA))
        .send(body);
    plateTaken = false;
    expect((await post({ plateNumber: '123456', capacityKg: 1500 })).status).toBe(201);
    expect((await post({ plateNumber: '123456', capacityKg: -5 })).status).toBe(400);
    plateTaken = true;
    expect((await post({ plateNumber: '123456', capacityKg: 1500 })).status).toBe(409);
  });

  it('refuses a company admin without a company', async () => {
    const res = await request(app())
      .get('/api/vehicles')
      .set('Authorization', auth('company_admin', null));
    expect(res.status).toBe(403);
  });
});
