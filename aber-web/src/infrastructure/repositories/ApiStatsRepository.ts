import type { PlatformStats } from '@/domain/entities/PlatformStats';
import type { StatsRepository } from '@/domain/repositories/StatsRepository';
import { http } from '../http/httpClient';

export class ApiStatsRepository implements StatsRepository {
  async platform(): Promise<PlatformStats> {
    const res = await http.get<{ data: PlatformStats }>('/admin/stats');
    return res.data.data;
  }
}
