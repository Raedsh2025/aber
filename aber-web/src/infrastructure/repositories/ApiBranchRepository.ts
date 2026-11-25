import type { Branch } from '@/domain/entities/Branch';
import type { BranchRepository, CreateBranchInput } from '@/domain/repositories/BranchRepository';
import { http } from '../http/httpClient';

export class ApiBranchRepository implements BranchRepository {
  async list(): Promise<Branch[]> {
    const res = await http.get<{ data: Branch[] }>('/branches');
    return res.data.data;
  }

  async create(input: CreateBranchInput): Promise<Branch> {
    const res = await http.post<{ data: Branch }>('/branches', input);
    return res.data.data;
  }
}
