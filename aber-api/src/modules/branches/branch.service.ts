import type { AuthUser } from '../../middlewares/authenticate';
import { AppError } from '../../shared/AppError';
import type { BranchDto, BranchRepository } from './branch.repository';

export interface BranchService {
  list(user: AuthUser): Promise<BranchDto[]>;
}

export function createBranchService(repo: BranchRepository): BranchService {
  return {
    list(user) {
      // Always scoped to the user's own company.
      if (!user.companyId) throw new AppError(403, 'FORBIDDEN', 'حسابك غير مرتبط بشركة');
      return repo.listByCompany(user.companyId);
    },
  };
}
