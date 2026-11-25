import type { Manifest, ScanResult, ScanType, Trip, TripStatus } from '@/domain/entities/Trip';
import type { CreateTripInput, TripRepository } from '@/domain/repositories/TripRepository';
import { http } from '../http/httpClient';

interface Envelope<T> {
  data: T;
}

export class ApiTripRepository implements TripRepository {
  async create(input: CreateTripInput): Promise<Trip> {
    const res = await http.post<Envelope<Trip>>('/trips', input);
    return res.data.data;
  }

  async list(status?: TripStatus): Promise<Trip[]> {
    const res = await http.get<Envelope<Trip[]>>('/trips', { params: { status } });
    return res.data.data;
  }

  async getManifest(tripId: string): Promise<Manifest> {
    const res = await http.get<Envelope<Manifest>>(`/trips/${tripId}/manifest`);
    return res.data.data;
  }

  async scan(tripId: string, trackingNumber: string, type: ScanType): Promise<ScanResult> {
    const res = await http.post<Envelope<ScanResult>>(`/trips/${tripId}/scan`, {
      trackingNumber,
      type,
    });
    return res.data.data;
  }

  async changeStatus(tripId: string, status: TripStatus): Promise<Trip> {
    const res = await http.patch<Envelope<Trip>>(`/trips/${tripId}/status`, { status });
    return res.data.data;
  }
}
