import type { Branch } from '../entities/Branch';

export interface CreateBranchInput {
  governorateCode: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface BranchRepository {
  list(): Promise<Branch[]>;
  create(input: CreateBranchInput): Promise<Branch>;
}
