import { randomBytes, randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAuthenticate, type AuthUser, type Role } from '../../middlewares/authenticate';
import { errorHandler } from '../../middlewares/errorHandler';
import type { ShipmentStatus } from '../../shared/domain/shipmentStatus';
import type { TripStatus } from '../../shared/domain/tripStatus';
import type { ShipmentDto, ShipmentRepository } from '../shipments/shipment.repository';
import type { ManifestRow } from './manifest';
import type { ScanType, TripDto, TripRepository } from './trip.repository';
import { createTripRouter } from './trip.routes';
import { createTripService } from './trip.service';

const secret = randomBytes(32).toString('hex');
const companyA = randomUUID();
const companyB = randomUUID();
const branchDam = randomUUID();
const branchAlp = randomUUID();
const branchOther = randomUUID();
const driverId = randomUUID();
const vehicleId = randomUUID();
const CAPACITY = 100;

function setup() {
  const trips: TripDto[] = [];
  const shipments: ShipmentDto[] = [];
  const scans: { tripId: string; shipmentId: string; type: ScanType }[] = [];
  const logs: { id: string; status: ShipmentStatus }[] = [];

  const loadOf = (tripId: string): number =>
    shipments.filter((s) => s.tripId === tripId).reduce((sum, s) => sum + s.weightKg, 0);
  const withLoad = (t: TripDto): TripDto => ({
    ...t,
    loadedKg: loadOf(t.id),
    freeKg: t.capacityKg - loadOf(t.id),
    shipmentsCount: shipments.filter((s) => s.tripId === t.id).length,
  });

  const tripRepo: TripRepository = {
    findById: (id) => {
      const t = trips.find((x) => x.id === id);
      return Promise.resolve(t ? withLoad(t) : undefined);
    },
    list: (_f, companyId, driver) =>
      Promise.resolve(
        trips
          .filter((t) => t.companyId === companyId && (!driver || t.driverId === driver))
          .map(withLoad),
      ),
    suggest: (companyId, from, to, weight) =>
      Promise.resolve(
        trips
          .map(withLoad)
          .filter(
            (t) =>
              t.companyId === companyId &&
              t.fromBranchId === from &&
              t.toBranchId === to &&
              (t.status === 'scheduled' || t.status === 'loading') &&
              t.freeKg >= weight,
          )
          .map((t) => ({ id: t.id, departureAt: t.departureAt, freeKg: t.freeKg })),
      ),
    insert: (d) => {
      const id = randomUUID();
      trips.push({
        id,
        companyId: d.companyId,
        fromBranchId: d.fromBranchId,
        toBranchId: d.toBranchId,
        driverId: d.driverId,
        vehicleId: d.vehicleId,
        departureAt: d.departureAt.toISOString(),
        estimatedArrivalAt: null,
        capacityKg: d.capacityKg,
        status: 'scheduled',
        loadedKg: 0,
        freeKg: d.capacityKg,
        shipmentsCount: 0,
      });
      return Promise.resolve(id);
    },
    updateStatus: (id, status: TripStatus) => {
      const t = trips.find((x) => x.id === id);
      if (t) t.status = status;
      return Promise.resolve();
    },
    findBranchCompanies: (ids) =>
      Promise.resolve(
        [
          { id: branchDam, company_id: companyA },
          { id: branchAlp, company_id: companyA },
          { id: branchOther, company_id: companyB },
        ].filter((b) => ids.includes(b.id)),
      ),
    findDriver: (id) =>
      Promise.resolve(
        id === driverId
          ? { company_id: companyA, role: 'line_driver', is_active: true }
          : undefined,
      ),
    findVehicle: (id) =>
      Promise.resolve(
        id === vehicleId ? { company_id: companyA, capacity_kg: 80, is_active: true } : undefined,
      ),
    assignShipment: (tripId, shipmentId) => {
      const s = shipments.find((x) => x.id === shipmentId);
      if (s) s.tripId = tripId;
      return Promise.resolve();
    },
    hasScan: (tripId, shipmentId, type) =>
      Promise.resolve(
        scans.some((s) => s.tripId === tripId && s.shipmentId === shipmentId && s.type === type),
      ),
    insertScan: (tripId, shipmentId, type) => {
      scans.push({ tripId, shipmentId, type });
      return Promise.resolve();
    },
    manifest: (tripId) =>
      Promise.resolve(
        shipments
          .filter((s) => s.tripId === tripId)
          .map<ManifestRow>((s) => ({
            id: s.id,
            trackingNumber: s.trackingNumber,
            weightKg: s.weightKg,
            status: s.status,
            loaded: scans.some(
              (x) => x.tripId === tripId && x.shipmentId === s.id && x.type === 'load',
            ),
            arrived: scans.some(
              (x) => x.tripId === tripId && x.shipmentId === s.id && x.type === 'arrive',
            ),
          })),
      ),
  };

  const unused = (): never => {
    throw new Error('not used in trip tests');
  };
  const shipmentRepo: ShipmentRepository = {
    findById: (id) => Promise.resolve(shipments.find((s) => s.id === id)),
    findByTracking: (t) => Promise.resolve(shipments.find((s) => s.trackingNumber === t)),
    updateStatus: (id, status) => {
      const s = shipments.find((x) => x.id === id);
      if (s) s.status = status;
      return Promise.resolve();
    },
    insertLog: (id, status) => {
      logs.push({ id, status });
      return Promise.resolve();
    },
    list: unused,
    findBranches: unused,
    findRoutePrice: unused,
    insert: unused,
    getOtpState: unused,
    bumpOtpAttempts: unused,
    insertCollection: unused,
    publicTracking: unused,
  };

  const addShipment = (over: Partial<ShipmentDto> = {}): ShipmentDto => {
    const s: ShipmentDto = {
      id: randomUUID(),
      trackingNumber: `AB26${String(shipments.length + 1).padStart(7, '0')}`,
      companyId: companyA,
      originBranchId: branchDam,
      destBranchId: branchAlp,
      tripId: null,
      senderName: 'a',
      senderPhone: '1',
      receiverName: 'b',
      receiverPhone: '2',
      goodsType: 'normal',
      weightKg: 40,
      price: 1,
      codAmount: 0,
      status: 'received',
      createdAt: new Date().toISOString(),
      ...over,
    };
    shipments.push(s);
    return s;
  };

  const service = createTripService({ trips: tripRepo, shipments: shipmentRepo }, (work) =>
    work({ trips: tripRepo, shipments: shipmentRepo }),
  );
  return { service, trips, shipments, logs, addShipment };
}

const makeUser = (role: Role, over: Partial<AuthUser> = {}): AuthUser => ({
  id: randomUUID(),
  role,
  companyId: companyA,
  branchId: branchDam,
  ...over,
});
const tokenFor = (u: AuthUser): string =>
  jwt.sign({ role: u.role, companyId: u.companyId, branchId: u.branchId }, secret, {
    subject: u.id,
  });

const tripBody = {
  fromBranchId: branchDam,
  toBranchId: branchAlp,
  driverId,
  departureAt: new Date(Date.now() + 3_600_000),
  capacityKg: CAPACITY,
};

let ctx: ReturnType<typeof setup>;
const admin = makeUser('company_admin');
beforeEach(() => {
  ctx = setup();
});

async function openTrip(): Promise<TripDto> {
  return ctx.service.create(admin, tripBody);
}

describe('trip creation', () => {
  it('creates a trip and caps capacity to the vehicle capacity', async () => {
    const t = await ctx.service.create(admin, { ...tripBody, vehicleId });
    expect(t.capacityKg).toBe(80);
    expect(t.status).toBe('scheduled');
  });
  it('rejects a branch of another company', async () => {
    await expect(
      ctx.service.create(admin, { ...tripBody, toBranchId: branchOther }),
    ).rejects.toMatchObject({
      code: 'INVALID_BRANCH',
    });
  });
  it('rejects an unknown driver', async () => {
    await expect(
      ctx.service.create(admin, { ...tripBody, driverId: randomUUID() }),
    ).rejects.toMatchObject({
      code: 'INVALID_DRIVER',
    });
  });
});

describe('assign (capacity check)', () => {
  it('assigns while there is room and refuses when capacity is exceeded', async () => {
    const trip = await openTrip();
    const a = ctx.addShipment();
    const b = ctx.addShipment();
    const c = ctx.addShipment();
    expect((await ctx.service.assign(admin, trip.id, a.id)).freeKg).toBe(60);
    expect((await ctx.service.assign(admin, trip.id, b.id)).freeKg).toBe(20);
    await expect(ctx.service.assign(admin, trip.id, c.id)).rejects.toMatchObject({
      status: 409,
      code: 'CAPACITY_EXCEEDED',
    });
  });
  it('refuses a different route, a second assignment and non-received shipments', async () => {
    const trip = await openTrip();
    const wrongRoute = ctx.addShipment({ destBranchId: branchOther });
    await expect(ctx.service.assign(admin, trip.id, wrongRoute.id)).rejects.toMatchObject({
      code: 'ROUTE_MISMATCH',
    });
    const ok = ctx.addShipment({ weightKg: 1 });
    await ctx.service.assign(admin, trip.id, ok.id);
    await expect(ctx.service.assign(admin, trip.id, ok.id)).rejects.toMatchObject({
      code: 'ALREADY_ASSIGNED',
    });
    const moving = ctx.addShipment({ status: 'in_transit' });
    await expect(ctx.service.assign(admin, trip.id, moving.id)).rejects.toMatchObject({
      code: 'INVALID_STATE',
    });
  });
  it('blocks another company', async () => {
    const trip = await openTrip();
    const s = ctx.addShipment();
    const stranger = makeUser('company_admin', { companyId: companyB });
    await expect(ctx.service.assign(stranger, trip.id, s.id)).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe('full trip flow with manifest matching', () => {
  it('loads, departs, scans arrival, detects a shortage and blocks closing', async () => {
    const trip = await openTrip();
    const a = ctx.addShipment({ weightKg: 10 });
    const b = ctx.addShipment({ weightKg: 10 });
    await ctx.service.assign(admin, trip.id, a.id);
    await ctx.service.assign(admin, trip.id, b.id);
    const driver = makeUser('line_driver', { id: driverId });

    await ctx.service.scan(driver, trip.id, { trackingNumber: a.trackingNumber, type: 'load' });
    await ctx.service.scan(driver, trip.id, { trackingNumber: b.trackingNumber, type: 'load' });
    expect(ctx.trips[0]?.status).toBe('loading');

    const dup = await ctx.service.scan(driver, trip.id, {
      trackingNumber: a.trackingNumber,
      type: 'load',
    });
    expect(dup.duplicate).toBe(true);

    await expect(
      ctx.service.scan(driver, trip.id, { trackingNumber: a.trackingNumber, type: 'arrive' }),
    ).rejects.toMatchObject({ code: 'TRIP_NOT_ARRIVING' });

    await ctx.service.changeStatus(driver, trip.id, 'in_transit');
    expect(ctx.shipments.map((s) => s.status)).toEqual(['in_transit', 'in_transit']);

    await ctx.service.changeStatus(driver, trip.id, 'arrived');
    await ctx.service.scan(driver, trip.id, { trackingNumber: a.trackingNumber, type: 'arrive' });
    expect(ctx.shipments[0]?.status).toBe('arrived');

    const m = await ctx.service.manifest(driver, trip.id);
    expect(m.summary.missing).toEqual([b.trackingNumber]);

    await expect(ctx.service.changeStatus(admin, trip.id, 'closed')).rejects.toMatchObject({
      code: 'MANIFEST_MISMATCH',
      details: { missing: [b.trackingNumber] },
    });

    await ctx.service.scan(driver, trip.id, { trackingNumber: b.trackingNumber, type: 'arrive' });
    expect((await ctx.service.changeStatus(admin, trip.id, 'closed')).status).toBe('closed');
  });

  it('refuses a scan of a shipment outside the trip and departing empty', async () => {
    const trip = await openTrip();
    const outsider = ctx.addShipment();
    const driver = makeUser('line_driver', { id: driverId });
    await expect(
      ctx.service.scan(driver, trip.id, { trackingNumber: outsider.trackingNumber, type: 'load' }),
    ).rejects.toMatchObject({ code: 'NOT_IN_TRIP' });
    await ctx.service.changeStatus(driver, trip.id, 'loading');
    await expect(ctx.service.changeStatus(driver, trip.id, 'in_transit')).rejects.toMatchObject({
      code: 'EMPTY_TRIP',
    });
  });

  it('only lets the assigned driver work on the trip, and drivers cannot close it', async () => {
    const trip = await openTrip();
    const other = makeUser('line_driver');
    await expect(ctx.service.manifest(other, trip.id)).rejects.toMatchObject({ status: 403 });
    const driver = makeUser('line_driver', { id: driverId });
    await expect(ctx.service.changeStatus(driver, trip.id, 'closed')).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe('suggest and list', () => {
  it('suggests trips with enough free space only', async () => {
    const trip = await openTrip();
    await ctx.service.assign(admin, trip.id, ctx.addShipment({ weightKg: 70 }).id);
    const staff = makeUser('branch_staff');
    const q = { originBranchId: branchDam, destBranchId: branchAlp };
    expect(await ctx.service.suggest(staff, { ...q, weightKg: 20 })).toHaveLength(1);
    expect(await ctx.service.suggest(staff, { ...q, weightKg: 50 })).toHaveLength(0);
  });
  it('shows a driver only their own trips', async () => {
    await openTrip();
    expect(await ctx.service.list(makeUser('line_driver'), {})).toHaveLength(0);
    expect(await ctx.service.list(makeUser('line_driver', { id: driverId }), {})).toHaveLength(1);
  });
});

describe('trip routes', () => {
  const buildApp = (): express.Express => {
    const app = express();
    app.use(express.json());
    app.use('/api/trips', createTripRouter(ctx.service, createAuthenticate(secret)));
    app.use(errorHandler);
    return app;
  };
  const auth = (u: AuthUser): [string, string] => ['Authorization', `Bearer ${tokenFor(u)}`];

  it('requires a token', async () => {
    expect((await request(buildApp()).get('/api/trips')).status).toBe(401);
  });
  it('lets only a company admin create trips', async () => {
    const res = await request(buildApp())
      .post('/api/trips')
      .set(...auth(makeUser('branch_staff')))
      .send(tripBody);
    expect(res.status).toBe(403);
    const ok = await request(buildApp())
      .post('/api/trips')
      .set(...auth(admin))
      .send(tripBody);
    expect(ok.status).toBe(201);
  });
  it('serves /suggest before /:id and validates the query', async () => {
    const res = await request(buildApp())
      .get('/api/trips/suggest')
      .set(...auth(makeUser('branch_staff')))
      .query({ originBranchId: branchDam });
    expect(res.status).toBe(400);
  });
  it('rejects a bad trip id with 400', async () => {
    const res = await request(buildApp())
      .get('/api/trips/xyz/manifest')
      .set(...auth(admin));
    expect(res.status).toBe(400);
  });
});
