import { z } from 'zod';

export const createBranchBody = z.object({
  governorateCode: z.string().trim().min(2).max(10),
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().max(200).optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{9,15}$/)
    .optional(),
});

export type CreateBranchBody = z.infer<typeof createBranchBody>;
