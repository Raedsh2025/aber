import type { CompanyStatus } from './Company';
import type { ShipmentStatus } from './Shipment';

export interface PlatformStats {
  companies: Partial<Record<CompanyStatus, number>>;
  users: number;
  trips: number;
  shipmentsTotal: number;
  shipmentsByStatus: Partial<Record<ShipmentStatus, number>>;
  totalRevenue: number;
  shipmentsPerDay: { day: string; count: number }[];
  cod: { collected: number; settled: number; pending: number };
}
