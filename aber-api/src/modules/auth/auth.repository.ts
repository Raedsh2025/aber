import type { Queryable } from '../../db/pool';
import type { Role } from '../../middlewares/authenticate';

export interface UserRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  companyId: string | null;
  branchId: string | null;
  passwordHash: string;
  isActive: boolean;
}

export interface NewCustomer {
  fullName: string;
  email: string;
  phone: string; // digits only; the service normalizes it
  passwordHash: string;
}

export interface AuthRepository {
  /** Every account whose email matches, plus every account whose phone matches the digits. */
  findForLogin(identifier: string, phoneDigits: string): Promise<UserRow[]>;
  emailExists(email: string): Promise<boolean>;
  phoneExists(phoneDigits: string): Promise<boolean>;
  createCustomer(input: NewCustomer): Promise<UserRow>;
}

const USER_COLUMNS = `id, full_name AS "fullName", email, phone, role,
         company_id AS "companyId", branch_id AS "branchId",
         password_hash AS "passwordHash", is_active AS "isActive"`;

// Repository: SQL only. No business rules here.
export function createAuthRepository(db: Queryable): AuthRepository {
  return {
    async findForLogin(identifier, phoneDigits) {
      const { rows } = await db.query<UserRow>(
        `SELECT ${USER_COLUMNS} FROM users
          WHERE lower(email) = lower($1)
             OR ($2 <> '' AND regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = $2)`,
        [identifier, phoneDigits],
      );
      return rows;
    },
    async emailExists(email) {
      const { rows } = await db.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [
        email,
      ]);
      return rows.length > 0;
    },
    async phoneExists(phoneDigits) {
      if (phoneDigits === '') return false;
      const { rows } = await db.query(
        `SELECT 1 FROM users
          WHERE regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = $1`,
        [phoneDigits],
      );
      return rows.length > 0;
    },
    async createCustomer(input) {
      const { rows } = await db.query<UserRow>(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, 'customer')
         RETURNING ${USER_COLUMNS}`,
        [input.fullName, input.email, input.phone, input.passwordHash],
      );
      return rows[0];
    },
  };
}
