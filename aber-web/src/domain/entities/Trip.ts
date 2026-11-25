import type { Shipment, ShipmentStatus } from './Shipment';

export type TripStatus = 'scheduled' | 'loading' | 'in_transit' | 'arrived' | 'closed';
export type ScanType = 'load' | 'arrive';

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  scheduled: 'مجدولة',
  loading: 'قيد التحميل',
  in_transit: 'في الطريق',
  arrived: 'وصلت',
  closed: 'مغلقة',
};

export interface Trip {
  id: string;
  companyId: string;
  fromBranchId: string;
  toBranchId: string;
  driverId: string | null;
  vehicleId: string | null;
  departureAt: string; // ISO
  estimatedArrivalAt: string | null;
  capacityKg: number;
  status: TripStatus;
  loadedKg: number;
  freeKg: number;
  shipmentsCount: number;
}

export interface ManifestRow {
  id: string;
  trackingNumber: string;
  weightKg: number;
  status: ShipmentStatus;
  loaded: boolean;
  arrived: boolean;
}

export interface ManifestSummary {
  assigned: number;
  loaded: number;
  arrived: number;
  notLoaded: string[];
  missing: string[]; // loaded but not scanned on arrival: possible shortage
}

export interface Manifest {
  trip: Trip;
  shipments: ManifestRow[];
  summary: ManifestSummary;
}

export interface ScanResult {
  duplicate: boolean;
  shipment: Shipment;
}
