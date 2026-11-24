import type { ShipmentStatus } from '../entities/Shipment';

const ALLOWED: Record<ShipmentStatus, ShipmentStatus[]> = {
  received: ['loaded', 'returned', 'issue'],
  loaded: ['in_transit', 'issue'],
  in_transit: ['arrived', 'issue'],
  arrived: ['delivered', 'returned', 'issue'],
  delivered: [],
  returned: [],
  issue: ['received', 'loaded', 'in_transit', 'arrived', 'returned'],
};

export const nextStatuses = (from: ShipmentStatus): ShipmentStatus[] => ALLOWED[from];

export const canTransition = (from: ShipmentStatus, to: ShipmentStatus): boolean =>
  ALLOWED[from].includes(to);
