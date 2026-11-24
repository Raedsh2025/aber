import { describe, expect, it } from 'vitest';
import { canTransition } from './shipmentStatus';

describe('canTransition', () => {
  it('allows the normal path', () => {
    expect(canTransition('received', 'loaded')).toBe(true);
    expect(canTransition('loaded', 'in_transit')).toBe(true);
    expect(canTransition('in_transit', 'arrived')).toBe(true);
    expect(canTransition('arrived', 'delivered')).toBe(true);
  });

  it('blocks skipping stages', () => {
    expect(canTransition('received', 'delivered')).toBe(false);
    expect(canTransition('loaded', 'arrived')).toBe(false);
  });

  it('does not leave a final state', () => {
    expect(canTransition('delivered', 'received')).toBe(false);
    expect(canTransition('returned', 'received')).toBe(false);
  });

  it('allows recovery from an issue', () => {
    expect(canTransition('issue', 'in_transit')).toBe(true);
    expect(canTransition('issue', 'delivered')).toBe(false);
  });
});
