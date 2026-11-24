import type { ShipmentStatus } from '../../shared/domain/shipmentStatus';

export interface ManifestRow {
  id: string;
  trackingNumber: string;
  weightKg: number;
  status: ShipmentStatus;
  loaded: boolean; // has a "load" scan
  arrived: boolean; // has an "arrive" scan
}

export interface ManifestSummary {
  assigned: number;
  loaded: number;
  arrived: number;
  notLoaded: string[]; // assigned but never scanned at loading
  missing: string[]; // loaded but not scanned at arrival = possible shortage
}

/** Matches the loading scans against the arrival scans of one trip. */
export function matchManifest(rows: ManifestRow[]): ManifestSummary {
  return {
    assigned: rows.length,
    loaded: rows.filter((r) => r.loaded).length,
    arrived: rows.filter((r) => r.arrived).length,
    notLoaded: rows.filter((r) => !r.loaded).map((r) => r.trackingNumber),
    missing: rows.filter((r) => r.loaded && !r.arrived).map((r) => r.trackingNumber),
  };
}
