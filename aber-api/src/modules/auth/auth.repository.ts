import type { Queryable } from '../../db/pool';
import type { Role } from '../../middlewares/authenticate';

export interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  companyId: string | null;
  branchId: string | null;
  passwordHash: string;
  isActive: boolean;
}

export interface AuthRepository {
  findByEmail(email: string): Promise<UserRow | undefined>;
}

// Repository: SQL only. No business rules here.
export function createAuthRepository(db: Queryable): AuthRepository {
  return {
    async findByEmail(email) {
      const { rows } = await db.query<UserRow>(
        `SELECT id, full_name AS "fullName", email, role,
                company_id AS "companyId", branch_id AS "branchId",
                password_hash AS "passwordHash", is_active AS "isActive"
           FROM users WHERE lower(email) = lower($1)`,
        [email],
      );
      return rows[0];
    },
  };
}
