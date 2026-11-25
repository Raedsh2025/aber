import type { ShipmentStatus } from './Shipment';

export interface BranchDailyReport {
  date: string; // YYYY-MM-DD
  branchId: string;
  branchName: string;
  shipmentsCount: number;
  totalWeightKg: number;
  totalPrice: number;
  totalCod: number;
  byStatus: Partial<Record<ShipmentStatus, number>>;
}
