import type { GoodsType } from './Shipment';

export interface PricedGovernorate {
  code: string;
  nameAr: string;
}

export interface PriceEstimate {
  from: string;
  to: string;
  price: number;
  estHours: number;
}

export interface PriceEstimateQuery {
  from: string;
  to: string;
  weightKg: number;
  goodsType: GoodsType;
}
