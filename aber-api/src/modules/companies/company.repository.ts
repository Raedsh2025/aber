import type { Queryable } from '../../db/pool';

export type CompanyStatus = 'pending' | 'approved' | 'suspended';

export interface CompanyDto {
  id: string;
  name: string;
  phone: string | null;
  status: CompanyStatus;
  createdAt: string;
}

export interface CompanyRepository {
  list(): Promise<CompanyDto[]>;
  /** Returns undefined when the company does not exist. */
  updateStatus(id: string, status: CompanyStatus): Promise<CompanyDto | undefined>;
}

const COLUMNS = `id, name, phone, status, created_at AS "createdAt"`;

// Repository: SQL only. No business rules here.
export function createCompanyRepository(db: Queryable): CompanyRepository {
  return {
    async list() {
      const { rows } = await db.query<CompanyDto>(
        `SELECT ${COLUMNS} FROM companies ORDER BY created_at DESC`,
      );
      return rows;
    },
    async updateStatus(id, status) {
      const { rows } = await db.query<CompanyDto>(
        `UPDATE companies SET status = $2 WHERE id = $1 RETURNING ${COLUMNS}`,
        [id, status],
      );
      return rows[0];
    },
  };
}
