import type { StaffMember } from '@/domain/entities/Staff';
import type { CreateStaffInput, StaffRepository } from '@/domain/repositories/StaffRepository';
import { http } from '../http/httpClient';

export class ApiStaffRepository implements StaffRepository {
  async list(): Promise<StaffMember[]> {
    const res = await http.get<{ data: StaffMember[] }>('/staff');
    return res.data.data;
  }

  async create(input: CreateStaffInput): Promise<StaffMember> {
    const res = await http.post<{ data: StaffMember }>('/staff', input);
    return res.data.data;
  }
}
