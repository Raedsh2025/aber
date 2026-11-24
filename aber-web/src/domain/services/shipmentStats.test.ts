import { describe, expect, it } from 'vitest';
import type { Shipment } from '../entities/Shipment';
import { computeShipmentStats } from './shipmentStats';

const make = (status: Shipment['status'], codAmount: number): Shipment =>
  ({ status, codAmount }) as Shipment;

describe('computeShipmentStats', () => {
  it('counts by status and sums only open cash on delivery', () => {
    const stats = computeShipmentStats([
      make('received', 100),
      make('in_transit', 50),
      make('delivered', 900),
      make('returned', 70),
    ]);
    expect(stats.total).toBe(4);
    expect(stats.inTransit).toBe(1);
    expect(stats.delivered).toBe(1);
    expect(stats.pendingCod).toBe(150);
    expect(stats.byStatus.received).toBe(1);
  });

  it('returns zeros for an empty list', () => {
    const stats = computeShipmentStats([]);
    expect(stats.total).toBe(0);
    expect(stats.pendingCod).toBe(0);
  });
});
