import type { PublicTracking, Shipment, ShipmentStatus } from '@/domain/entities/Shipment';
import type {
  CreateShipmentInput,
  ShipmentFilters,
  ShipmentRepository,
} from '@/domain/repositories/ShipmentRepository';
import { http } from '../http/httpClient';

interface Envelope<T> {
  data: T;
}

export class ApiShipmentRepository implements ShipmentRepository {
  async create(input: CreateShipmentInput): Promise<Shipment> {
    const res = await http.post<Envelope<Shipment>>('/shipments', input);
    return res.data.data;
  }

  async list(filters: ShipmentFilters = {}): Promise<Shipment[]> {
    const res = await http.get<Envelope<Shipment[]>>('/shipments', { params: filters });
    return res.data.data;
  }

  async getByTrackingNumber(trackingNumber: string): Promise<Shipment> {
    const res = await http.get<Envelope<Shipment>>(
      `/shipments/by-tracking/${encodeURIComponent(trackingNumber)}`,
    );
    return res.data.data;
  }

  async changeStatus(id: string, status: ShipmentStatus, note?: string): Promise<Shipment> {
    const res = await http.patch<Envelope<Shipment>>(`/shipments/${id}/status`, { status, note });
    return res.data.data;
  }

  async deliver(id: string, otp: string): Promise<Shipment> {
    const res = await http.post<Envelope<Shipment>>(`/shipments/${id}/deliver`, { otp });
    return res.data.data;
  }

  async trackPublic(trackingNumber: string): Promise<PublicTracking> {
    const res = await http.get<Envelope<PublicTracking>>(
      `/public/track/${encodeURIComponent(trackingNumber)}`,
    );
    return res.data.data;
  }
}
