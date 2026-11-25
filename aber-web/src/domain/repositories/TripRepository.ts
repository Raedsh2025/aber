import type { Manifest, ScanResult, ScanType, Trip, TripStatus } from '../entities/Trip';

export interface CreateTripInput {
  fromBranchId: string;
  toBranchId: string;
  driverId?: string;
  vehicleId?: string;
  departureAt: string; // ISO
  capacityKg?: number;
}

export interface TripRepository {
  create(input: CreateTripInput): Promise<Trip>;
  list(status?: TripStatus): Promise<Trip[]>;
  getManifest(tripId: string): Promise<Manifest>;
  scan(tripId: string, trackingNumber: string, type: ScanType): Promise<ScanResult>;
  changeStatus(tripId: string, status: TripStatus): Promise<Trip>;
}
