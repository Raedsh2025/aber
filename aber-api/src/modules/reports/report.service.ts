import type { AuthUser } from '../../middlewares/authenticate';
import { AppError } from '../../shared/AppError';
import type { BranchDailyReport, ReportRepository } from './report.repository';
import type { BranchDailyQuery } from './report.schema';

export interface ReportService {
  branchDaily(user: AuthUser, query: BranchDailyQuery): Promise<BranchDailyReport>;
}

const TIME_ZONE = 'Asia/Damascus';
const today = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date());

export function createReportService(
  repo: ReportRepository,
  now: () => string = today,
): ReportService {
  return {
    async branchDaily(user, query) {
      if (!user.companyId) throw new AppError(403, 'FORBIDDEN', 'حسابك غير مرتبط بشركة');
      // A branch employee sees only their own branch. A company admin picks one of the company's branches.
      const branchId =
        user.role === 'branch_staff' ? user.branchId : (query.branchId ?? user.branchId);
      if (!branchId) throw new AppError(400, 'BRANCH_REQUIRED', 'حدّد الفرع');
      if (user.role === 'branch_staff' && query.branchId && query.branchId !== branchId) {
        throw new AppError(403, 'FORBIDDEN', 'لا تملك صلاحية هذا الفرع');
      }
      const branchName = await repo.findBranchName(user.companyId, branchId);
      if (!branchName) throw new AppError(404, 'BRANCH_NOT_FOUND', 'الفرع غير موجود');
      const date = query.date ?? now();
      const totals = await repo.branchDaily(user.companyId, branchId, date);
      return { date, branchId, branchName, ...totals };
    },
  };
}
