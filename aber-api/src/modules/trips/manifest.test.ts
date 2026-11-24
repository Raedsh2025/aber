import { describe, expect, it } from 'vitest';
import { matchManifest, type ManifestRow } from './manifest';

const row = (t: string, loaded: boolean, arrived: boolean): ManifestRow => ({
  id: t,
  trackingNumber: t,
  weightKg: 1,
  status: 'received',
  loaded,
  arrived,
});

describe('matchManifest', () => {
  it('finds shipments loaded but not scanned at arrival', () => {
    const s = matchManifest([row('A', true, true), row('B', true, false), row('C', false, false)]);
    expect(s).toEqual({ assigned: 3, loaded: 2, arrived: 1, notLoaded: ['C'], missing: ['B'] });
  });
  it('reports nothing missing when all arrived', () => {
    expect(matchManifest([row('A', true, true)]).missing).toEqual([]);
  });
});
