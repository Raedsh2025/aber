import { z } from 'zod';
import type { Shipment } from '@/domain/entities/Shipment';
import type { ShipmentRepository } from '@/domain/repositories/ShipmentRepository';

export const otpSchema = z.object({ otp: z.string().regex(/^[0-9]{6}$/, 'الرمز 6 أرقام') });

export const makeDeliverShipment =
  (repo: ShipmentRepository) =>
  (shipment: Shipment, otp: string): Promise<Shipment> => {
    if (shipment.status !== 'arrived') {
      throw new Error('لا يمكن التسليم قبل وصول الشحنة');
    }
    return repo.deliver(shipment.id, otp);
  };
