import type { Company, CompanyStatus } from '../entities/Company';

export interface CompanyRepository {
  list(): Promise<Company[]>;
  changeStatus(id: string, status: CompanyStatus): Promise<Company>;
}
