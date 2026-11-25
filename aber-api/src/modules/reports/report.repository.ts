import type { Queryable } from '../../db/pool';

export interface BranchDailyReport {
  date: string;
  branchId: string;
  branchName: string;
  shipmentsCount: number;
  totalWeightKg: number;
  totalPrice: number;
  totalCod: number;
  byStatus: Record<string, number>;
}

export interface ReportRepository {
  /** Branch name, or undefined when the branch is not in the company. */
  findBranchName(companyId: string, branchId: string): Promise<string | undefined>;
  /** Shipments created at the branch on the given day (Asia/Damascus). */
  branchDaily(
    companyId: string,
    branchId: string,
    date: string,
  ): Promise<Omit<BranchDailyReport, 'branchName' | 'branchId' | 'date'>>;
}

const TIME_ZONE = 'Asia/Damascus';

interface Row {
  status: string;
  count: number;
  weight: number;
  price: number;
  cod: number;
}

// Repository: SQL only. No business rules here.
export function createReportRepository(db: Queryable): ReportRepository {
  return {
    async findBranchName(companyId, branchId) {
      const { rows } = await db.query<{ name: string }>(
        `SELECT name FROM branches WHERE id = $1 AND company_id = $2`,
        [branchId, companyId],
      );
      return rows[0]?.name;
    },
    async branchDaily(companyId, branchId, date) {
      const { rows } = await db.query<Row>(
        `SELECT status::text AS status,
                count(*)::int AS count,
                COALESCE(sum(weight_kg), 0)::float AS weight,
                COALESCE(sum(price), 0)::float AS price,
                COALESCE(sum(cod_amount), 0)::float AS cod
           FROM shipments
          WHERE company_id = $1 AND origin_branch_id = $2
            AND created_at >= ($3::date::timestamp AT TIME ZONE '${TIME_ZONE}')
            AND created_at <  ((($3::date + 1)::timestamp) AT TIME ZONE '${TIME_ZONE}')
          GROUP BY status`,
        [companyId, branchId, date],
      );
      const byStatus: Record<string, number> = {};
      let shipmentsCount = 0;
      let totalWeightKg = 0;
      let totalPrice = 0;
      let totalCod = 0;
      for (const r of rows) {
        byStatus[r.status] = r.count;
        shipmentsCount += r.count;
        totalWeightKg += r.weight;
        totalPrice += r.price;
        totalCod += r.cod;
      }
      return { shipmentsCount, totalWeightKg, totalPrice, totalCod, byStatus };
    },
  };
}
