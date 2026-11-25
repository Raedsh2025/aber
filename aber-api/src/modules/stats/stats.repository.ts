import type { Queryable } from '../../db/pool';

export interface PlatformStats {
  companies: Record<string, number>;
  users: number;
  trips: number;
  shipmentsTotal: number;
  shipmentsByStatus: Record<string, number>;
  totalRevenue: number;
}

export interface StatsRepository {
  platform(): Promise<PlatformStats>;
}

interface CountRow {
  key: string;
  count: number;
}

const toMap = (rows: CountRow[]): Record<string, number> =>
  Object.fromEntries(rows.map((r) => [r.key, r.count]));

// Repository: SQL only. Counts are cast to int/float because pg returns numeric as strings.
export function createStatsRepository(db: Queryable): StatsRepository {
  return {
    async platform() {
      const [companies, shipments, totals] = await Promise.all([
        db.query<CountRow>(
          `SELECT status::text AS key, count(*)::int AS count FROM companies GROUP BY status`,
        ),
        db.query<CountRow>(
          `SELECT status::text AS key, count(*)::int AS count FROM shipments GROUP BY status`,
        ),
        db.query<{ users: number; trips: number; revenue: number }>(
          `SELECT (SELECT count(*) FROM users)::int AS users,
                  (SELECT count(*) FROM trips)::int AS trips,
                  (SELECT COALESCE(sum(price), 0) FROM shipments)::float AS revenue`,
        ),
      ]);
      const byStatus = toMap(shipments.rows);
      const row = totals.rows[0] ?? { users: 0, trips: 0, revenue: 0 };
      return {
        companies: toMap(companies.rows),
        users: row.users,
        trips: row.trips,
        shipmentsTotal: Object.values(byStatus).reduce((a, b) => a + b, 0),
        shipmentsByStatus: byStatus,
        totalRevenue: row.revenue,
      };
    },
  };
}
