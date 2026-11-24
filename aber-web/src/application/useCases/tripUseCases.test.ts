import { describe, expect, it, vi } from 'vitest';
import type { Trip } from '@/domain/entities/Trip';
import type { TripRepository } from '@/domain/repositories/TripRepository';
import { makeAdvanceTripStatus } from './advanceTripStatus';
import { makeScanShipment } from './scanTrip';

const trip = (status: Trip['status']): Trip => ({
  id: 't1',
  companyId: 'c',
  fromBranchId: 'a',
  toBranchId: 'b',
  driverId: 'd',
  vehicleId: null,
  departureAt: '2026-11-25T08:00:00Z',
  estimatedArrivalAt: null,
  capacityKg: 1000,
  status,
  loadedKg: 0,
  freeKg: 1000,
  shipmentsCount: 0,
});

const fakeRepo = (): TripRepository => ({
  list: vi.fn(),
  getManifest: vi.fn(),
  scan: vi.fn().mockResolvedValue({ duplicate: false }),
  changeStatus: vi.fn().mockResolvedValue({}),
});

describe('scan use case', () => {
  it('sends a load scan while the trip is loading', async () => {
    const repo = fakeRepo();
    await makeScanShipment(repo)(trip('loading'), '  AB260000001 ');
    expect(repo.scan).toHaveBeenCalledWith('t1', 'AB260000001', 'load');
  });

  it('sends an arrive scan after departure', async () => {
    const repo = fakeRepo();
    await makeScanShipment(repo)(trip('in_transit'), 'AB260000001');
    expect(repo.scan).toHaveBeenCalledWith('t1', 'AB260000001', 'arrive');
  });

  it('refuses to scan a closed trip or an empty code', () => {
    const repo = fakeRepo();
    expect(() => makeScanShipment(repo)(trip('closed'), 'AB1')).toThrow();
    expect(() => makeScanShipment(repo)(trip('loading'), '  ')).toThrow();
    expect(repo.scan).not.toHaveBeenCalled();
  });
});

describe('advance trip status use case', () => {
  it('asks for the next status', async () => {
    const repo = fakeRepo();
    await makeAdvanceTripStatus(repo)(trip('scheduled'));
    expect(repo.changeStatus).toHaveBeenCalledWith('t1', 'loading');
  });

  it('refuses when the trip is already closed', () => {
    expect(() => makeAdvanceTripStatus(fakeRepo())(trip('closed'))).toThrow();
  });
});
