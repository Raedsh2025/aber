import { z } from 'zod';
import type { PriceEstimate } from '@/domain/entities/PriceEstimate';
import type { EstimateRepository } from '@/domain/repositories/EstimateRepository';

const MAX_WEIGHT_KG = 20_000;

export const estimateSchema = z
  .object({
    from: z.string().min(1, 'اختر محافظة الانطلاق'),
    to: z.string().min(1, 'اختر محافظة الوجهة'),
    weightKg: z.coerce
      .number('أدخل الوزن')
      .positive('الوزن يجب أن يكون أكبر من صفر')
      .max(MAX_WEIGHT_KG, 'الوزن كبير جدًا'),
    goodsType: z.enum(['normal', 'fragile', 'refrigerated']),
  })
  .refine((v) => v.from !== v.to, {
    message: 'محافظة الوجهة يجب أن تختلف عن محافظة الانطلاق',
    path: ['to'],
  });

export type EstimateForm = z.input<typeof estimateSchema>;

export const makeEstimatePrice =
  (repo: EstimateRepository) =>
  (raw: unknown): Promise<PriceEstimate> =>
    repo.estimate(estimateSchema.parse(raw));
