import type { Branch } from '../entities/Branch';

export interface BranchRepository {
  list(): Promise<Branch[]>;
}
