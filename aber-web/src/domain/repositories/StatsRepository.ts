import type { PlatformStats } from '../entities/PlatformStats';

export interface StatsRepository {
  platform(): Promise<PlatformStats>;
}
