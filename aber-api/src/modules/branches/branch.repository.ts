import type { Queryable } from '../../db/pool';

export interface BranchDto {
  id: string;
  name: string;
  governorateCode: string;
  governorateName: string;
  address: string | null;
}

export interface BranchRepository {
  listByCompany(companyId: string): Promise<BranchDto[]>;
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
  };
}
