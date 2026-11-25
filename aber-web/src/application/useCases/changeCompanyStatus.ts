import type { Company, CompanyStatus } from '@/domain/entities/Company';
import type { CompanyRepository } from '@/domain/repositories/CompanyRepository';

export const makeChangeCompanyStatus =
  (repo: CompanyRepository) =>
  (company: Company, status: CompanyStatus): Promise<Company> => {
    if (company.status === status) throw new Error('الشركة بهذه الحالة بالفعل');
    return repo.changeStatus(company.id, status);
  };
