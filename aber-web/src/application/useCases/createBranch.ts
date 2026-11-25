import { z } from 'zod';
import type { Branch } from '@/domain/entities/Branch';
import type { BranchRepository } from '@/domain/repositories/BranchRepository';

const phone = z.string().regex(/^\+?[0-9]{9,15}$/, 'رقم هاتف غير صالح');

export const createBranchSchema = z.object({
  governorateCode: z.string().min(1, 'اختر المحافظة'),
  name: z.string().trim().min(2, 'الاسم قصير'),
  address: z.string().trim().optional(),
  phone: phone.or(z.literal('')).optional(),
});

export type CreateBranchForm = z.input<typeof createBranchSchema>;

// Empty optional inputs are removed so the API does not receive empty strings.
export const makeCreateBranch =
  (repo: BranchRepository) =>
  (raw: unknown): Promise<Branch> => {
    const form = createBranchSchema.parse(raw);
    return repo.create({
      governorateCode: form.governorateCode,
      name: form.name,
      address: form.address || undefined,
      phone: form.phone || undefined,
    });
  };
