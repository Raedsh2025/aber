import type { ShipmentStatus } from './Shipment';

/** What a customer sees on their own account page. */
export interface MyShipment {
  trackingNumber: string;
  status: ShipmentStatus;
  originGovernorate: string;
  destGovernorate: string;
  createdAt: string; // ISO
}
