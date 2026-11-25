import type { Company, CompanyStatus } from '@/domain/entities/Company';
import type { CompanyRepository } from '@/domain/repositories/CompanyRepository';
import { http } from '../http/httpClient';

export class ApiCompanyRepository implements CompanyRepository {
  async list(): Promise<Company[]> {
    const res = await http.get<{ data: Company[] }>('/admin/companies');
    return res.data.data;
  }

  async changeStatus(id: string, status: CompanyStatus): Promise<Company> {
    const res = await http.patch<{ data: Company }>(`/admin/companies/${id}/status`, { status });
    return res.data.data;
  }
}
