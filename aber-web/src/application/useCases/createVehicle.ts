import { z } from 'zod';
import type { Vehicle } from '@/domain/entities/Vehicle';
import type { VehicleRepository } from '@/domain/repositories/VehicleRepository';

const MAX_CAPACITY_KG = 100_000;

export const createVehicleSchema = z.object({
  plateNumber: z.string().trim().min(2, 'أدخل رقم اللوحة').max(20, 'رقم اللوحة طويل'),
  capacityKg: z.coerce
    .number('أدخل السعة')
    .positive('السعة يجب أن تكون أكبر من صفر')
    .max(MAX_CAPACITY_KG, 'السعة كبيرة جدًا'),
});

export type CreateVehicleForm = z.input<typeof createVehicleSchema>;

export const makeCreateVehicle =
  (repo: VehicleRepository) =>
  (raw: unknown): Promise<Vehicle> =>
    repo.create(createVehicleSchema.parse(raw));
