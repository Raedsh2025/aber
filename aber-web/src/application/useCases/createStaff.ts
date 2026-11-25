import { z } from 'zod';
import type { StaffMember } from '@/domain/entities/Staff';
import type { StaffRepository } from '@/domain/repositories/StaffRepository';

const MIN_PASSWORD_LENGTH = 8;

export const createStaffSchema = z
  .object({
    fullName: z.string().trim().min(2, 'الاسم قصير'),
    email: z.email('بريد إلكتروني غير صالح'),
    phone: z
      .string()
      .regex(/^\+?[0-9]{9,15}$/, 'رقم هاتف غير صالح')
      .or(z.literal(''))
      .optional(),
    password: z.string().min(MIN_PASSWORD_LENGTH, 'كلمة المرور 8 أحرف على الأقل'),
    role: z.enum(['branch_staff', 'line_driver']),
    branchId: z.string().optional(),
  })
  .refine((v) => v.role !== 'branch_staff' || !!v.branchId, {
    message: 'اختر فرع الموظف',
    path: ['branchId'],
  });

export type CreateStaffForm = z.input<typeof createStaffSchema>;

export const makeCreateStaff =
  (repo: StaffRepository) =>
  (raw: unknown): Promise<StaffMember> => {
    const form = createStaffSchema.parse(raw);
    return repo.create({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      role: form.role,
      branchId: form.role === 'branch_staff' ? form.branchId : undefined,
    });
  };
