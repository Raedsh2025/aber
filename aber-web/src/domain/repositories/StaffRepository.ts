import type { StaffMember, StaffRole } from '../entities/Staff';

export interface CreateStaffInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: StaffRole;
  branchId?: string;
}

export interface StaffRepository {
  list(): Promise<StaffMember[]>;
  create(input: CreateStaffInput): Promise<StaffMember>;
}
