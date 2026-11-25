import { describe, expect, it, vi } from 'vitest';
import type { BranchRepository } from '@/domain/repositories/BranchRepository';
import type { StaffRepository } from '@/domain/repositories/StaffRepository';
import type { TripRepository } from '@/domain/repositories/TripRepository';
import type { VehicleRepository } from '@/domain/repositories/VehicleRepository';
import { makeCreateBranch } from './createBranch';
import { makeCreateStaff } from './createStaff';
import { makeCreateTrip } from './createTrip';
import { makeCreateVehicle } from './createVehicle';

const branchA = 'branch-a';
const branchB = 'branch-b';

describe('createBranch', () => {
  it('drops empty optional fields', async () => {
    const repo = { list: vi.fn(), create: vi.fn().mockResolvedValue({}) } as BranchRepository;
    await makeCreateBranch(repo)({ governorateCode: 'DAM', name: 'فرع', address: '', phone: '' });
    expect(repo.create).toHaveBeenCalledWith({
      governorateCode: 'DAM',
      name: 'فرع',
      address: undefined,
      phone: undefined,
    });
  });

  it('rejects a missing governorate', () => {
    const repo = { list: vi.fn(), create: vi.fn() } as BranchRepository;
    expect(() => makeCreateBranch(repo)({ governorateCode: '', name: 'فرع' })).toThrow();
  });
});

describe('createVehicle', () => {
  it('accepts a positive capacity typed as text', async () => {
    const repo = { list: vi.fn(), create: vi.fn().mockResolvedValue({}) } as VehicleRepository;
    await makeCreateVehicle(repo)({ plateNumber: '123456', capacityKg: '1500' });
    expect(repo.create).toHaveBeenCalledWith({ plateNumber: '123456', capacityKg: 1500 });
  });

  it('rejects zero capacity', () => {
    const repo = { list: vi.fn(), create: vi.fn() } as VehicleRepository;
    expect(() => makeCreateVehicle(repo)({ plateNumber: '123456', capacityKg: 0 })).toThrow();
  });
});

describe('createStaff', () => {
  const repo = (): StaffRepository => ({ list: vi.fn(), create: vi.fn().mockResolvedValue({}) });
  const base = { fullName: 'اسم', email: 'a@b.co', password: 'long-enough-pass' };

  it('needs a branch for branch staff', () => {
    expect(() => makeCreateStaff(repo())({ ...base, role: 'branch_staff' })).toThrow();
  });

  it('does not send a branch for a driver', async () => {
    const r = repo();
    await makeCreateStaff(r)({ ...base, role: 'line_driver', branchId: branchA });
    expect(r.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'line_driver', branchId: undefined }),
    );
  });

  it('rejects a short password', () => {
    expect(() =>
      makeCreateStaff(repo())({ ...base, password: 'short', role: 'line_driver' }),
    ).toThrow();
  });
});

describe('createTrip', () => {
  const repo = (): TripRepository =>
    ({ create: vi.fn().mockResolvedValue({}) }) as unknown as TripRepository;
  const base = { fromBranchId: branchA, toBranchId: branchB, departureAt: '2026-12-01T08:00' };

  it('needs a vehicle or a capacity', () => {
    expect(() => makeCreateTrip(repo())(base)).toThrow();
  });

  it('refuses the same branch on both ends', () => {
    expect(() =>
      makeCreateTrip(repo())({ ...base, toBranchId: branchA, capacityKg: 100 }),
    ).toThrow();
  });

  it('sends an ISO date and drops empty optional ids', async () => {
    const r = repo();
    await makeCreateTrip(r)({ ...base, driverId: '', vehicleId: 'v1', capacityKg: '' });
    expect(r.create).toHaveBeenCalledWith({
      fromBranchId: branchA,
      toBranchId: branchB,
      driverId: undefined,
      vehicleId: 'v1',
      departureAt: new Date('2026-12-01T08:00').toISOString(),
      capacityKg: undefined,
    });
  });
});
