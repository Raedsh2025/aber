import { describe, expect, it } from 'vitest';
import { canTransition, nextStatuses } from './shipmentStatus';

describe('shipment status rules', () => {
  it('allows the normal path and blocks skipping', () => {
    expect(canTransition('received', 'loaded')).toBe(true);
    expect(canTransition('received', 'delivered')).toBe(false);
  });
  it('has no way out of final states', () => {
    expect(nextStatuses('delivered')).toEqual([]);
    expect(nextStatuses('returned')).toEqual([]);
  });
});
