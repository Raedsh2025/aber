import { describe, expect, it } from 'vitest';
import { canTripTransition } from './tripStatus';

describe('canTripTransition', () => {
  it('allows the normal path one step at a time', () => {
    expect(canTripTransition('scheduled', 'loading')).toBe(true);
    expect(canTripTransition('loading', 'in_transit')).toBe(true);
    expect(canTripTransition('in_transit', 'arrived')).toBe(true);
    expect(canTripTransition('arrived', 'closed')).toBe(true);
  });
  it('blocks skipping and going back', () => {
    expect(canTripTransition('scheduled', 'in_transit')).toBe(false);
    expect(canTripTransition('in_transit', 'loading')).toBe(false);
    expect(canTripTransition('closed', 'scheduled')).toBe(false);
  });
});
