import { z } from 'zod';

export const branchDailyQuery = z.object({
  date: z.iso.date().optional(),
  branchId: z.uuid().optional(),
});

export type BranchDailyQuery = z.infer<typeof branchDailyQuery>;
