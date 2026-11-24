import { z } from 'zod';

const MAX_CAPACITY_KG = 100_000;

export const createTripBody = z
  .object({
    fromBranchId: z.uuid(),
    toBranchId: z.uuid(),
    driverId: z.uuid().optional(),
    vehicleId: z.uuid().optional(),
    departureAt: z.coerce.date(),
    estimatedArrivalAt: z.coerce.date().optional(),
    // Optional when a vehicle is given: the vehicle capacity is used.
    capacityKg: z.coerce.number().positive().max(MAX_CAPACITY_KG).optional(),
  })
  .refine((v) => v.fromBranchId !== v.toBranchId, { path: ['toBranchId'] })
  .refine((v) => v.capacityKg !== undefined || v.vehicleId !== undefined, {
    path: ['capacityKg'],
  })
  .refine((v) => !v.estimatedArrivalAt || v.estimatedArrivalAt > v.departureAt, {
    path: ['estimatedArrivalAt'],
  });

export const tripStatusEnum = z.enum(['scheduled', 'loading', 'in_transit', 'arrived', 'closed']);

export const tripStatusBody = z.object({ status: tripStatusEnum });
export const assignBody = z.object({ shipmentId: z.uuid() });
export const scanBody = z.object({
  trackingNumber: z.string().trim().min(1).max(30),
  type: z.enum(['load', 'arrive']),
});

export const tripListQuery = z.object({ status: tripStatusEnum.optional() });
export const suggestQuery = z.object({
  originBranchId: z.uuid(),
  destBranchId: z.uuid(),
  weightKg: z.coerce.number().positive().max(MAX_CAPACITY_KG),
});

export const tripIdParam = z.uuid();

export type CreateTripBody = z.infer<typeof createTripBody>;
export type ScanBody = z.infer<typeof scanBody>;
export type TripListQuery = z.infer<typeof tripListQuery>;
export type SuggestQuery = z.infer<typeof suggestQuery>;
