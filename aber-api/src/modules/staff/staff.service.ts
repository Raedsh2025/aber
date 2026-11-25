import bcrypt from 'bcryptjs';
import type { AuthUser } from '../../middlewares/authenticate';
import { AppError } from '../../shared/AppError';
import type { StaffDto, StaffRepository } from './staff.repository';
import type { CreateStaffBody } from './staff.schema';

const BCRYPT_ROUNDS = 12;

export interface StaffService {
  list(user: AuthUser): Promise<StaffDto[]>;
  create(user: AuthUser, body: CreateStaffBody): Promise<StaffDto>;
}

function requireCompany(user: AuthUser): string {
  if (!user.companyId) throw new AppError(403, 'FORBIDDEN', 'حسابك غير مرتبط بشركة');
  return user.companyId;
}

export function createStaffService(repo: StaffRepository): StaffService {
  return {
    list: (user) => repo.listByCompany(requireCompany(user)),

    async create(user, body) {
      const companyId = requireCompany(user);
      const branchId = body.role === 'branch_staff' ? (body.branchId ?? null) : null;
      // Company scope: the branch must belong to the caller's company.
      if (branchId && !(await repo.branchBelongsToCompany(branchId, companyId))) {
        throw new AppError(403, 'FORBIDDEN', 'الفرع لا يتبع شركتك');
      }
      const created = await repo.insert({
        companyId,
        branchId,
        fullName: body.fullName,
        email: body.email,
        phone: body.phone ?? null,
        passwordHash: await bcrypt.hash(body.password, BCRYPT_ROUNDS),
        role: body.role,
      });
      if (!created) throw new AppError(409, 'EMAIL_EXISTS', 'البريد الإلكتروني مستخدم مسبقًا');
      return created;
    },
  };
}
