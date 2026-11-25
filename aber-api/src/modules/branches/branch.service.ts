import type { AuthUser } from '../../middlewares/authenticate';
import { AppError } from '../../shared/AppError';
import type { CreateBranchBody } from './branch.schema';
import type { BranchDto, BranchRepository } from './branch.repository';

export interface BranchService {
  list(user: AuthUser): Promise<BranchDto[]>;
  create(user: AuthUser, body: CreateBranchBody): Promise<BranchDto>;
}

export function createBranchService(repo: BranchRepository): BranchService {
  return {
    list(user) {
      // Always scoped to the user's own company.
      if (!user.companyId) throw new AppError(403, 'FORBIDDEN', 'حسابك غير مرتبط بشركة');
      return repo.listByCompany(user.companyId);
    },

    async create(user, body) {
      if (!user.companyId) throw new AppError(403, 'FORBIDDEN', 'حسابك غير مرتبط بشركة');
      if (!(await repo.governorateExists(body.governorateCode))) {
        throw new AppError(400, 'UNKNOWN_GOVERNORATE', 'المحافظة غير معروفة');
      }
      const created = await repo.insert({
        companyId: user.companyId,
        governorateCode: body.governorateCode,
        name: body.name,
        address: body.address ?? null,
        phone: body.phone ?? null,
      });
      if (!created)
        throw new AppError(409, 'BRANCH_EXISTS', 'يوجد فرع بالاسم نفسه في هذه المحافظة');
      return created;
    },
  };
}
