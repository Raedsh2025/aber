import type { GoodsType, PublicTracking, Shipment, ShipmentStatus } from '../entities/Shipment';

export interface CreateShipmentInput {
  originBranchId: string;
  destBranchId: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  goodsType: GoodsType;
  weightKg: number;
  codAmount: number;
}

export interface ShipmentFilters {
  status?: ShipmentStatus;
  branchId?: string;
  tripId?: string;
  search?: string;
}

export interface ShipmentRepository {
  create(input: CreateShipmentInput): Promise<Shipment>;
  list(filters?: ShipmentFilters): Promise<Shipment[]>;
  getByTrackingNumber(trackingNumber: string): Promise<Shipment>;
  changeStatus(id: string, status: ShipmentStatus, note?: string): Promise<Shipment>;
  deliver(id: string, otp: string): Promise<Shipment>;
  trackPublic(trackingNumber: string): Promise<PublicTracking>;
}
