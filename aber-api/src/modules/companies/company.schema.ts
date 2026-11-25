import { z } from 'zod';

export const COMPANY_STATUSES = ['pending', 'approved', 'suspended'] as const;

export const companyIdParams = z.object({ id: z.uuid() });
export const updateCompanyStatusBody = z.object({ status: z.enum(COMPANY_STATUSES) });

export type UpdateCompanyStatusBody = z.infer<typeof updateCompanyStatusBody>;
