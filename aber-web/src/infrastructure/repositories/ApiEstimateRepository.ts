import type {
  PriceEstimate,
  PriceEstimateQuery,
  PricedGovernorate,
} from '@/domain/entities/PriceEstimate';
import type { EstimateRepository } from '@/domain/repositories/EstimateRepository';
import { http } from '../http/httpClient';

export class ApiEstimateRepository implements EstimateRepository {
  async estimate(query: PriceEstimateQuery): Promise<PriceEstimate> {
    const res = await http.get<{ data: PriceEstimate }>('/public/estimate', { params: query });
    return res.data.data;
  }

  async governorates(): Promise<PricedGovernorate[]> {
    const res = await http.get<{ data: PricedGovernorate[] }>('/public/governorates');
    return res.data.data;
  }
}
