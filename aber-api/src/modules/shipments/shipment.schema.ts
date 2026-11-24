import { z } from 'zod';

const phone = z.string().regex(/^\+?[0-9]{9,15}$/);
const MAX_WEIGHT_KG = 20_000;

export const createShipmentBody = z
  .object({
    originBranchId: z.uuid(),
    destBranchId: z.uuid(),
    senderName: z.string().trim().min(2).max(100),
    senderPhone: phone,
    receiverName: z.string().trim().min(2).max(100),
    receiverPhone: phone,
    goodsType: z.enum(['normal', 'fragile', 'refrigerated']),
    weightKg: z.coerce.number().positive().max(MAX_WEIGHT_KG),
    codAmount: z.coerce.number().min(0).default(0),
  })
  .refine((v) => v.originBranchId !== v.destBranchId, { path: ['destBranchId'] });

export const statusBody = z.object({
  status: z.enum(['received', 'loaded', 'in_transit', 'arrived', 'delivered', 'returned', 'issue']),
  note: z.string().max(300).optional(),
});

export const deliverBody = z.object({ otp: z.string().regex(/^[0-9]{6}$/) });

export const listQuery = z.object({
  status: statusBody.shape.status.optional(),
  branchId: z.uuid().optional(),
  tripId: z.uuid().optional(),
  search: z.string().trim().max(50).optional(),
});

export const idParam = z.uuid();
export const trackingParam = z.string().trim().min(1).max(30);

export type CreateShipmentBody = z.infer<typeof createShipmentBody>;
export type StatusBody = z.infer<typeof statusBody>;
export type DeliverBody = z.infer<typeof deliverBody>;
export type ListQuery = z.infer<typeof listQuery>;
