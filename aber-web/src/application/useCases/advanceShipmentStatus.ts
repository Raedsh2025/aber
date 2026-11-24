import type { Shipment, ShipmentStatus } from '@/domain/entities/Shipment';
import type { ShipmentRepository } from '@/domain/repositories/ShipmentRepository';
import { canTransition } from '@/domain/services/shipmentStatus';

export const makeAdvanceShipmentStatus =
  (repo: ShipmentRepository) =>
  async (shipment: Shipment, next: ShipmentStatus, note?: string): Promise<Shipment> => {
    if (!canTransition(shipment.status, next)) {
      throw new Error('انتقال الحالة غير مسموح');
    }
    return repo.changeStatus(shipment.id, next, note);
  };
