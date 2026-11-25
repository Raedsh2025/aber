import { z } from 'zod';

const MAX_WEIGHT_KG = 20_000;
const governorateCode = z.string().regex(/^[A-Z]{3}$/);

export const estimateQuery = z
  .object({
    from: governorateCode,
    to: governorateCode,
    weightKg: z.coerce.number().positive().max(MAX_WEIGHT_KG),
    goodsType: z.enum(['normal', 'fragile', 'refrigerated']).default('normal'),
  })
  .refine((v) => v.from !== v.to, { path: ['to'] });

export type EstimateQuery = z.infer<typeof estimateQuery>;
