import type { Queryable } from '../../db/pool';

export interface BranchDto {
  id: string;
  name: string;
  governorateCode: string;
  governorateName: string;
  address: string | null;
}

export interface NewBranch {
  companyId: string;
  governorateCode: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export interface BranchRepository {
  listByCompany(companyId: string): Promise<BranchDto[]>;
  governorateExists(code: string): Promise<boolean>;
  /** Returns undefined when the company already has a branch with this name in the governorate. */
  insert(branch: NewBranch): Promise<BranchDto | undefined>;
}

// Repository: SQL only. No business rules here.
export function createBranchRepository(db: Queryable): BranchRepository {
  return {
    async listByCompany(companyId) {
      const { rows } = await db.query<BranchDto>(
        `SELECT b.id, b.name, b.governorate_code AS "governorateCode",
                g.name_ar AS "governorateName", b.address
           FROM branches b
           JOIN governorates g ON g.code = b.governorate_code
          WHERE b.company_id = $1
          ORDER BY g.name_ar, b.name`,
        [companyId],
      );
      return rows;
    },
    async governorateExists(code) {
      const { rows } = await db.query<{ code: string }>(
        'SELECT code FROM governorates WHERE code = $1',
        [code],
      );
      return rows.length > 0;
    },
    async insert(b) {
      const { rows } = await db.query<BranchDto>(
        `WITH ins AS (
           INSERT INTO branches (company_id, governorate_code, name, address, phone)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (company_id, governorate_code, name) DO NOTHING
           RETURNING id, name, governorate_code, address
         )
         SELECT ins.id, ins.name, ins.governorate_code AS "governorateCode",
                g.name_ar AS "governorateName", ins.address
           FROM ins JOIN governorates g ON g.code = ins.governorate_code`,
        [b.companyId, b.governorateCode, b.name, b.address, b.phone],
      );
      return rows[0];
    },
  };
}
