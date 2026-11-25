import type { BranchDailyReport } from '@/domain/entities/BranchDailyReport';
import type { BranchDailyQuery, ReportRepository } from '@/domain/repositories/ReportRepository';
import { http } from '../http/httpClient';

export class ApiReportRepository implements ReportRepository {
  async branchDaily(query: BranchDailyQuery): Promise<BranchDailyReport> {
    const res = await http.get<{ data: BranchDailyReport }>('/reports/branch-daily', {
      params: query,
    });
    return res.data.data;
  }
}
