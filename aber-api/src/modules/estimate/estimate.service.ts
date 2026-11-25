import { AppError } from '../../shared/AppError';
import { calculatePrice } from '../shipments/pricing';
import type { EstimateRepository, GovernorateDto } from './estimate.repository';
import type { EstimateQuery } from './estimate.schema';

export interface EstimateResult {
  from: string;
  to: string;
  price: number;
  estHours: number;
}

export interface EstimateService {
  estimate(query: EstimateQuery): Promise<EstimateResult>;
  governorates(): Promise<GovernorateDto[]>;
}

export function createEstimateService(repo: EstimateRepository): EstimateService {
  return {
    async estimate(query) {
      const route = await repo.findRoute(query.from, query.to);
      if (!route) throw new AppError(404, 'NO_ROUTE_PRICE', 'لا يوجد سعر معرّف لهذا المسار');
      // Same formula as shipment creation (shipments/pricing.ts is the single source).
      const price = calculatePrice(route, query.weightKg, query.goodsType);
      return { from: query.from, to: query.to, price, estHours: route.est_hours };
    },
    governorates: () => repo.listPricedGovernorates(),
  };
}
