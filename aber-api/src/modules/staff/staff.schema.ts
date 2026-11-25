import { z } from 'zod';

const MIN_PASSWORD_LENGTH = 8;

export const createStaffBody = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z.email(),
    phone: z
      .string()
      .regex(/^\+?[0-9]{9,15}$/)
      .optional(),
    password: z.string().min(MIN_PASSWORD_LENGTH).max(72), // bcrypt ignores bytes after 72
    role: z.enum(['branch_staff', 'line_driver']),
    branchId: z.uuid().optional(),
  })
  // A branch employee works at one branch. A driver is not tied to a branch.
  .refine((v) => v.role !== 'branch_staff' || v.branchId !== undefined, { path: ['branchId'] });

export type CreateStaffBody = z.infer<typeof createStaffBody>;
