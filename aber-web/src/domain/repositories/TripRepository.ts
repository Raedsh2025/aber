import type { Manifest, ScanResult, ScanType, Trip, TripStatus } from '../entities/Trip';

export interface TripRepository {
  list(status?: TripStatus): Promise<Trip[]>;
  getManifest(tripId: string): Promise<Manifest>;
  scan(tripId: string, trackingNumber: string, type: ScanType): Promise<ScanResult>;
  changeStatus(tripId: string, status: TripStatus): Promise<Trip>;
}
