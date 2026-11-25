import type { Queryable } from '../../db/pool';

export type StaffRole = 'branch_staff' | 'line_driver';

export interface StaffDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: StaffRole;
  branchId: string | null;
  isActive: boolean;
}

export interface NewStaff {
  companyId: string;
  branchId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: StaffRole;
}

export interface StaffRepository {
  listByCompany(companyId: string): Promise<StaffDto[]>;
  branchBelongsToCompany(branchId: string, companyId: string): Promise<boolean>;
  /** Returns undefined when the email is already used. */
  insert(staff: NewStaff): Promise<StaffDto | undefined>;
}

const COLUMNS = `id, full_name AS "fullName", email, phone, role, branch_id AS "branchId", is_active AS "isActive"`;

// Repository: SQL only. No business rules here.
export function createStaffRepository(db: Queryable): StaffRepository {
  return {
    async listByCompany(companyId) {
      const { rows } = await db.query<StaffDto>(
        `SELECT ${COLUMNS} FROM users
          WHERE company_id = $1 AND role IN ('branch_staff', 'line_driver')
          ORDER BY role, full_name`,
        [companyId],
      );
      return rows;
    },
    async branchBelongsToCompany(branchId, companyId) {
      const { rows } = await db.query<{ id: string }>(
        'SELECT id FROM branches WHERE id = $1 AND company_id = $2',
        [branchId, companyId],
      );
      return rows.length > 0;
    },
    async insert(s) {
      const { rows } = await db.query<StaffDto>(
        `INSERT INTO users (company_id, branch_id, full_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, lower($4), $5, $6, $7)
         ON CONFLICT (lower(email)) DO NOTHING
         RETURNING ${COLUMNS}`,
        [s.companyId, s.branchId, s.fullName, s.email, s.phone, s.passwordHash, s.role],
      );
      return rows[0];
    },
  };
}
