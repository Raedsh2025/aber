import { AppError } from '../../shared/AppError';
import type { CompanyDto, CompanyRepository, CompanyStatus } from './company.repository';

export interface CompanyService {
  list(): Promise<CompanyDto[]>;
  setStatus(id: string, status: CompanyStatus): Promise<CompanyDto>;
}

export function createCompanyService(repo: CompanyRepository): CompanyService {
  return {
    list: () => repo.list(),

    async setStatus(id, status) {
      const updated = await repo.updateStatus(id, status);
      if (!updated) throw new AppError(404, 'COMPANY_NOT_FOUND', 'الشركة غير موجودة');
      return updated;
    },
  };
}
