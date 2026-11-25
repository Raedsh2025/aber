import { z } from 'zod';

const MAX_CAPACITY_KG = 100_000;

export const createVehicleBody = z.object({
  plateNumber: z.string().trim().min(2).max(20),
  capacityKg: z.coerce.number().positive().max(MAX_CAPACITY_KG),
});

export type CreateVehicleBody = z.infer<typeof createVehicleBody>;
