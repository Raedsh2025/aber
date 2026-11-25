import type { BranchDailyReport } from '../entities/BranchDailyReport';

export interface BranchDailyQuery {
  date?: string;
  branchId?: string;
}

export interface ReportRepository {
  branchDaily(query: BranchDailyQuery): Promise<BranchDailyReport>;
}
