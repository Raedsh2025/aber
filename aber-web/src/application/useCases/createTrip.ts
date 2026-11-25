import { z } from 'zod';
import type { Trip } from '@/domain/entities/Trip';
import type { TripRepository } from '@/domain/repositories/TripRepository';

const MAX_CAPACITY_KG = 100_000;

export const createTripSchema = z
  .object({
    fromBranchId: z.string().min(1, 'اختر فرع الانطلاق'),
    toBranchId: z.string().min(1, 'اختر فرع الوجهة'),
    driverId: z.string().optional(),
    vehicleId: z.string().optional(),
    departureAt: z.string().min(1, 'اختر موعد الانطلاق'),
    capacityKg: z
      .union([z.literal(''), z.coerce.number().positive().max(MAX_CAPACITY_KG)])
      .optional(),
  })
  .refine((v) => v.fromBranchId !== v.toBranchId, {
    message: 'فرع الوجهة يجب أن يختلف عن فرع الانطلاق',
    path: ['toBranchId'],
  })
  .refine((v) => !!v.vehicleId || (v.capacityKg !== undefined && v.capacityKg !== ''), {
    message: 'اختر مركبة أو أدخل السعة',
    path: ['capacityKg'],
  });

export type CreateTripForm = z.input<typeof createTripSchema>;

export const makeCreateTrip =
  (repo: TripRepository) =>
  (raw: unknown): Promise<Trip> => {
    const form = createTripSchema.parse(raw);
    return repo.create({
      fromBranchId: form.fromBranchId,
      toBranchId: form.toBranchId,
      driverId: form.driverId || undefined,
      vehicleId: form.vehicleId || undefined,
      departureAt: new Date(form.departureAt).toISOString(),
      capacityKg: form.capacityKg === '' ? undefined : form.capacityKg,
    });
  };
