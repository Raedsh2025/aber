import { randomBytes, randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAuthenticate, type AuthUser, type Role } from '../../middlewares/authenticate';
import { errorHandler } from '../../middlewares/errorHandler';
import type { ShipmentStatus } from '../../shared/domain/shipmentStatus';
import type { NewCollection, ShipmentDto, ShipmentRepository } from './shipment.repository';
import { createShipmentRouters } from './shipment.routes';
import { createShipmentService, MAX_OTP_ATTEMPTS } from './shipment.service';

const secret = randomBytes(32).toString('hex');
const companyA = randomUUID();
const companyB = randomUUID();
const branchDam = randomUUID();
const branchAlp = randomUUID();
const branchOther = randomUUID();

interface Stored extends ShipmentDto {
  otpHash: string;
  attempts: number;
}

// In-memory repository: these tests do not touch a real database.
function createFakeRepo() {
  const shipments: Stored[] = [];
  const logs: { id: string; status: ShipmentStatus }[] = [];
  const collections: NewCollection[] = [];
  const repo: ShipmentRepository = {
    findById: (id) => Promise.resolve(shipments.find((s) => s.id === id)),
    findByTracking: (t) => Promise.resolve(shipments.find((s) => s.trackingNumber === t)),
    list: (_f, companyId) =>
      Promise.resolve(shipments.filter((s) => !companyId || s.companyId === companyId)),
    findBranches: (ids) =>
      Promise.resolve(
        [
          { id: branchDam, company_id: companyA, governorate_code: 'DA' },
          { id: branchAlp, company_id: companyA, governorate_code: 'AL' },
          { id: branchOther, company_id: companyB, governorate_code: 'HO' },
        ].filter((b) => ids.includes(b.id)),
      ),
    findRoutePrice: (from, to) =>
      Promise.resolve(
        from === 'DA' && to === 'AL'
          ? { base_price: 10_000, price_per_kg: 500, est_hours: 5 }
          : undefined,
      ),
    insert: (d) => {
      const id = randomUUID();
      shipments.push({
        id,
        trackingNumber: `AB26${String(shipments.length + 1).padStart(7, '0')}`,
        companyId: d.companyId,
        originBranchId: d.originBranchId,
        destBranchId: d.destBranchId,
        tripId: null,
        senderName: d.senderName,
        senderPhone: d.senderPhone,
        receiverName: d.receiverName,
        receiverPhone: d.receiverPhone,
        goodsType: d.goodsType,
        weightKg: d.weightKg,
        price: d.price,
        codAmount: d.codAmount,
        status: 'received',
        createdAt: new Date().toISOString(),
        otpHash: d.otpHash,
        attempts: 0,
      });
      return Promise.resolve(id);
    },
    updateStatus: (id, status) => {
      const s = shipments.find((x) => x.id === id);
      if (s) s.status = status;
      return Promise.resolve();
    },
    insertLog: (id, status) => {
      logs.push({ id, status });
      return Promise.resolve();
    },
    getOtpState: (id) => {
      const s = shipments.find((x) => x.id === id);
      return Promise.resolve(s ? { hash: s.otpHash, attempts: s.attempts } : undefined);
    },
    bumpOtpAttempts: (id) => {
      const s = shipments.find((x) => x.id === id);
      if (s) s.attempts += 1;
      return Promise.resolve();
    },
    insertCollection: (c) => {
      collections.push(c);
      return Promise.resolve();
    },
    publicTracking: (t) => {
      const s = shipments.find((x) => x.trackingNumber === t);
      return Promise.resolve(
        s
          ? {
              trackingNumber: s.trackingNumber,
              status: s.status,
              originGovernorate: 'دمشق',
              destGovernorate: 'حلب',
              history: [],
            }
          : undefined,
      );
    },
  };
  return { repo, shipments, logs, collections };
}

const makeUser = (role: Role, over: Partial<AuthUser> = {}): AuthUser => ({
  id: randomUUID(),
  role,
  companyId: companyA,
  branchId: branchDam,
  ...over,
});

const tokenFor = (user: AuthUser): string =>
  jwt.sign({ role: user.role, companyId: user.companyId, branchId: user.branchId }, secret, {
    subject: user.id,
  });

let fake: ReturnType<typeof createFakeRepo>;
let service: ReturnType<typeof createShipmentService>;

beforeEach(() => {
  fake = createFakeRepo();
  service = createShipmentService(fake.repo, (work) => work(fake.repo));
});

const body = {
  originBranchId: branchDam,
  destBranchId: branchAlp,
  senderName: 'Sender Name',
  senderPhone: '+963911111111',
  receiverName: 'Receiver Name',
  receiverPhone: '0922222222',
  goodsType: 'fragile' as const,
  weightKg: 20,
  codAmount: 5000,
};

describe('shipmentService.create', () => {
  it('computes the price on the server, logs "received" and returns the OTP once', async () => {
    const created = await service.create(makeUser('branch_staff'), body);
    expect(created.price).toBe(25_000);
    expect(created.status).toBe('received');
    expect(created.deliveryOtp).toMatch(/^[0-9]{6}$/);
    expect(fake.logs).toEqual([{ id: created.id, status: 'received' }]);
    expect(JSON.stringify(fake.shipments[0])).not.toContain(created.deliveryOtp);
  });

  it('refuses a branch staff member creating from another branch', async () => {
    const user = makeUser('branch_staff', { branchId: branchAlp });
    await expect(service.create(user, body)).rejects.toMatchObject({ status: 403 });
  });

  it('refuses a branch from another company', async () => {
    const user = makeUser('company_admin');
    await expect(
      service.create(user, { ...body, destBranchId: branchOther }),
    ).rejects.toMatchObject({ code: 'INVALID_BRANCH' });
  });

  it('refuses a route without a price', async () => {
    const user = makeUser('company_admin');
    await expect(
      service.create(user, { ...body, originBranchId: branchAlp, destBranchId: branchDam }),
    ).rejects.toMatchObject({ code: 'NO_ROUTE_PRICE' });
  });
});

describe('shipmentService.changeStatus', () => {
  it('follows allowed transitions and logs them', async () => {
    const user = makeUser('branch_staff');
    const s = await service.create(user, body);
    const next = await service.changeStatus(user, s.id, 'loaded');
    expect(next.status).toBe('loaded');
    expect(fake.logs.at(-1)).toEqual({ id: s.id, status: 'loaded' });
  });

  it('rejects a skipped stage with 409', async () => {
    const user = makeUser('branch_staff');
    const s = await service.create(user, body);
    await expect(service.changeStatus(user, s.id, 'arrived')).rejects.toMatchObject({
      status: 409,
      code: 'INVALID_TRANSITION',
    });
  });

  it('forces delivery through the OTP endpoint', async () => {
    const user = makeUser('branch_staff');
    const s = await service.create(user, body);
    await expect(service.changeStatus(user, s.id, 'delivered')).rejects.toMatchObject({
      code: 'USE_DELIVER',
    });
  });

  it('limits a driver to driver statuses', async () => {
    const staff = makeUser('branch_staff');
    const s = await service.create(staff, body);
    await expect(
      service.changeStatus(makeUser('line_driver'), s.id, 'returned'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('blocks users from another company', async () => {
    const s = await service.create(makeUser('branch_staff'), body);
    const stranger = makeUser('company_admin', { companyId: companyB });
    await expect(service.changeStatus(stranger, s.id, 'loaded')).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe('shipmentService.deliver', () => {
  async function arrivedShipment(): Promise<{ id: string; otp: string; user: AuthUser }> {
    const user = makeUser('branch_staff');
    const s = await service.create(user, body);
    for (const status of ['loaded', 'in_transit', 'arrived'] as const) {
      await service.changeStatus(user, s.id, status);
    }
    return { id: s.id, otp: s.deliveryOtp, user };
  }

  it('refuses delivery before arrival', async () => {
    const user = makeUser('branch_staff');
    const s = await service.create(user, body);
    await expect(service.deliver(user, s.id, s.deliveryOtp)).rejects.toMatchObject({
      code: 'NOT_ARRIVED',
    });
  });

  it('delivers with the right OTP and records the COD collection', async () => {
    const { id, otp, user } = await arrivedShipment();
    const done = await service.deliver(user, id, otp);
    expect(done.status).toBe('delivered');
    expect(fake.collections).toEqual([
      { shipmentId: id, branchId: branchDam, amount: 5000, collectedBy: user.id },
    ]);
  });

  it('rejects a wrong OTP and locks after the maximum attempts', async () => {
    const { id, otp, user } = await arrivedShipment();
    const wrong = otp === '000000' ? '111111' : '000000';
    for (let i = 0; i < MAX_OTP_ATTEMPTS; i += 1) {
      await expect(service.deliver(user, id, wrong)).rejects.toMatchObject({ code: 'WRONG_OTP' });
    }
    await expect(service.deliver(user, id, otp)).rejects.toMatchObject({
      status: 429,
      code: 'OTP_LOCKED',
    });
  });
});

describe('shipmentService.trackPublic', () => {
  it('returns only public fields', async () => {
    const s = await service.create(makeUser('branch_staff'), body);
    const data = await service.trackPublic(s.trackingNumber);
    expect(Object.keys(data).sort()).toEqual(
      ['destGovernorate', 'history', 'originGovernorate', 'status', 'trackingNumber'].sort(),
    );
  });
  it('returns 404 for an unknown number', async () => {
    await expect(service.trackPublic('nope')).rejects.toMatchObject({ status: 404 });
  });
});

describe('shipment routes', () => {
  function buildApp(): express.Express {
    const app = express();
    app.use(express.json());
    const { shipmentRouter, publicRouter } = createShipmentRouters(
      service,
      createAuthenticate(secret),
    );
    app.use('/api/public', publicRouter);
    app.use('/api/shipments', shipmentRouter);
    app.use(errorHandler);
    return app;
  }
  const auth = (u: AuthUser): [string, string] => ['Authorization', `Bearer ${tokenFor(u)}`];

  it('requires a token', async () => {
    const res = await request(buildApp()).get('/api/shipments');
    expect(res.status).toBe(401);
  });

  it('forbids a driver from creating a shipment', async () => {
    const res = await request(buildApp())
      .post('/api/shipments')
      .set(...auth(makeUser('line_driver')))
      .send(body);
    expect(res.status).toBe(403);
  });

  it('validates the body', async () => {
    const res = await request(buildApp())
      .post('/api/shipments')
      .set(...auth(makeUser('branch_staff')))
      .send({ ...body, weightKg: -1 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('creates a shipment (201) and rejects an invalid id with 400', async () => {
    const user = makeUser('branch_staff');
    const created = await request(buildApp())
      .post('/api/shipments')
      .set(...auth(user))
      .send(body);
    expect(created.status).toBe(201);
    expect(created.body.data.deliveryOtp).toMatch(/^[0-9]{6}$/);

    const bad = await request(buildApp())
      .patch('/api/shipments/not-a-uuid/status')
      .set(...auth(user))
      .send({ status: 'loaded' });
    expect(bad.status).toBe(400);
  });

  it('serves public tracking without a token', async () => {
    const s = await service.create(makeUser('branch_staff'), body);
    const res = await request(buildApp()).get(`/api/public/track/${s.trackingNumber}`);
    expect(res.status).toBe(200);
    expect(res.body.data.trackingNumber).toBe(s.trackingNumber);
    expect(res.body.data.senderPhone).toBeUndefined();
  });
});
