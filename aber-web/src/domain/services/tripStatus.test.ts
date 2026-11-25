import { describe, expect, it } from 'vitest';
import { nextDriverStatus, nextTripStatus, scanTypeFor } from './tripStatus';

describe('trip status rules', () => {
  it('moves one step forward', () => {
    expect(nextTripStatus('scheduled')).toBe('loading');
    expect(nextTripStatus('in_transit')).toBe('arrived');
    expect(nextTripStatus('closed')).toBeNull();
  });

  it('never lets a driver close a trip', () => {
    expect(nextDriverStatus('arrived')).toBeNull();
    expect(nextDriverStatus('loading')).toBe('in_transit');
  });

  it('picks the scan type from the trip status', () => {
    expect(scanTypeFor('scheduled')).toBe('load');
    expect(scanTypeFor('loading')).toBe('load');
    expect(scanTypeFor('in_transit')).toBe('arrive');
    expect(scanTypeFor('closed')).toBeNull();
  });
});
