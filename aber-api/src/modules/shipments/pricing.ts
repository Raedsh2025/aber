import type { GoodsType } from './shipment.repository';

const GOODS_FACTOR: Record<GoodsType, number> = { normal: 1, fragile: 1.25, refrigerated: 1.5 };

/** Official price: (base + per-kg * weight) * goods factor, rounded. Always computed on the server. */
export function calculatePrice(
  route: { base_price: number; price_per_kg: number },
  weightKg: number,
  goodsType: GoodsType,
): number {
  return Math.round((route.base_price + route.price_per_kg * weightKg) * GOODS_FACTOR[goodsType]);
}
