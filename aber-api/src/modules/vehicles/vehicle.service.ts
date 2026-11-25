import type { AuthUser } from '../../middlewares/authenticate';
import { AppError } from '../../shared/AppError';
import type { VehicleDto, VehicleRepository } from './vehicle.repository';
import type { CreateVehicleBody } from './vehicle.schema';

export interface VehicleService {
  list(user: AuthUser): Promise<VehicleDto[]>;
  create(user: AuthUser, body: CreateVehicleBody): Promise<VehicleDto>;
}

function requireCompany(user: AuthUser): string {
  if (!user.companyId) throw new AppError(403, 'FORBIDDEN', 'حسابك غير مرتبط بشركة');
  return user.companyId;
}

export function createVehicleService(repo: VehicleRepository): VehicleService {
  return {
    list: (user) => repo.listByCompany(requireCompany(user)),

    async create(user, body) {
      const created = await repo.insert({ companyId: requireCompany(user), ...body });
      if (!created) throw new AppError(409, 'PLATE_EXISTS', 'رقم اللوحة مسجّل مسبقًا');
      return created;
    },
  };
}
