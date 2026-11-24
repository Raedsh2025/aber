import type { Shipment, ShipmentStatus } from '../entities/Shipment';

export interface ShipmentStats {
  total: number;
  inTransit: number;
  delivered: number;
  pendingCod: number;
  byStatus: Record<ShipmentStatus, number>;
}

const EMPTY_COUNTS: Record<ShipmentStatus, number> = {
  received: 0,
  loaded: 0,
  in_transit: 0,
  arrived: 0,
  delivered: 0,
  returned: 0,
  issue: 0,
};

// Cash on delivery counts as pending until the shipment is delivered.
export function computeShipmentStats(shipments: Shipment[]): ShipmentStats {
  const byStatus = { ...EMPTY_COUNTS };
  let pendingCod = 0;
  for (const s of shipments) {
    byStatus[s.status] += 1;
    if (s.status !== 'delivered' && s.status !== 'returned') pendingCod += s.codAmount;
  }
  return {
    total: shipments.length,
    inTransit: byStatus.in_transit,
    delivered: byStatus.delivered,
    pendingCod,
    byStatus,
  };
}
