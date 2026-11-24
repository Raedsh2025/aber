import { z } from 'zod';
import type { ShipmentRepository } from '@/domain/repositories/ShipmentRepository';
import type { Shipment } from '@/domain/entities/Shipment';

const MAX_WEIGHT_KG = 20_000;
const phone = z.string().regex(/^\+?[0-9]{9,15}$/, 'رقم هاتف غير صالح');

export const createShipmentSchema = z
  .object({
    originBranchId: z.uuid('اختر فرع الانطلاق'),
    destBranchId: z.uuid('اختر فرع الوجهة'),
    senderName: z.string().trim().min(2, 'الاسم قصير'),
    senderPhone: phone,
    receiverName: z.string().trim().min(2, 'الاسم قصير'),
    receiverPhone: phone,
    goodsType: z.enum(['normal', 'fragile', 'refrigerated']),
    weightKg: z.coerce
      .number('أدخل الوزن')
      .positive('الوزن يجب أن يكون أكبر من صفر')
      .max(MAX_WEIGHT_KG, 'الوزن كبير جدًا'),
    codAmount: z.coerce.number('أدخل مبلغًا صحيحًا').min(0, 'المبلغ لا يكون سالبًا').default(0),
  })
  .refine((v) => v.originBranchId !== v.destBranchId, {
    message: 'فرع الوجهة يجب أن يختلف عن فرع الانطلاق',
    path: ['destBranchId'],
  });

export type CreateShipmentForm = z.input<typeof createShipmentSchema>;

export const makeCreateShipment =
  (repo: ShipmentRepository) =>
  (raw: unknown): Promise<Shipment> =>
    repo.create(createShipmentSchema.parse(raw));
