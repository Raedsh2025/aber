import { describe, expect, it, vi } from 'vitest';
import type { Shipment } from '@/domain/entities/Shipment';
import type { ShipmentRepository } from '@/domain/repositories/ShipmentRepository';
import { makeAdvanceShipmentStatus } from './advanceShipmentStatus';
import { createShipmentSchema, makeCreateShipment } from './createShipment';
import { makeDeliverShipment, otpSchema } from './deliverShipment';

const uuidA = '7f1c2d3e-4b5a-4c6d-8e7f-0a1b2c3d4e5f';
const uuidB = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

const shipment = (status: Shipment['status']): Shipment => ({
  id: 's1',
  trackingNumber: 'AB260000001',
  companyId: 'c1',
  originBranchId: uuidA,
  destBranchId: uuidB,
  tripId: null,
  senderName: 'a',
  senderPhone: '1',
  receiverName: 'b',
  receiverPhone: '2',
  goodsType: 'normal',
  weightKg: 1,
  price: 1,
  codAmount: 0,
  status,
  createdAt: new Date().toISOString(),
});

const validForm = {
  originBranchId: uuidA,
  destBranchId: uuidB,
  senderName: 'مرسل تجربة',
  senderPhone: '0911111111',
  receiverName: 'مستلم تجربة',
  receiverPhone: '+963922222222',
  goodsType: 'normal',
  weightKg: '12.5',
  codAmount: '',
};

describe('createShipmentSchema', () => {
  it('accepts a valid form and converts numbers', () => {
    const r = createShipmentSchema.safeParse({ ...validForm, codAmount: '5000' });
    expect(r.success && r.data.weightKg).toBe(12.5);
    expect(r.success && r.data.codAmount).toBe(5000);
  });
  it('rejects the same origin and destination with an Arabic message', () => {
    const r = createShipmentSchema.safeParse({ ...validForm, destBranchId: uuidA });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('فرع الوجهة يجب أن يختلف');
  });
  it('rejects bad phone and non-positive weight', () => {
    expect(createShipmentSchema.safeParse({ ...validForm, senderPhone: 'abc' }).success).toBe(
      false,
    );
    expect(createShipmentSchema.safeParse({ ...validForm, weightKg: '0' }).success).toBe(false);
  });
});

describe('use cases', () => {
  it('create sends parsed input to the repository', async () => {
    const create = vi.fn().mockResolvedValue(shipment('received'));
    await makeCreateShipment({ create } as unknown as ShipmentRepository)(validForm);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ weightKg: 12.5 }));
  });
  it('advance refuses a forbidden transition without calling the API', async () => {
    const changeStatus = vi.fn();
    const advance = makeAdvanceShipmentStatus({ changeStatus } as unknown as ShipmentRepository);
    await expect(advance(shipment('received'), 'arrived')).rejects.toThrow('غير مسموح');
    expect(changeStatus).not.toHaveBeenCalled();
  });
  it('deliver refuses before arrival and validates the OTP shape', () => {
    const deliver = vi.fn();
    const run = makeDeliverShipment({ deliver } as unknown as ShipmentRepository);
    expect(() => run(shipment('loaded'), '123456')).toThrow('قبل وصول');
    expect(deliver).not.toHaveBeenCalled();
    expect(otpSchema.safeParse({ otp: '12345' }).success).toBe(false);
    expect(otpSchema.safeParse({ otp: '123456' }).success).toBe(true);
  });
});
