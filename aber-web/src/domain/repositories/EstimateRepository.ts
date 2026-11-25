import type {
  PriceEstimate,
  PriceEstimateQuery,
  PricedGovernorate,
} from '../entities/PriceEstimate';

export interface EstimateRepository {
  estimate(query: PriceEstimateQuery): Promise<PriceEstimate>;
  governorates(): Promise<PricedGovernorate[]>;
}
