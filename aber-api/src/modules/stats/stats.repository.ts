import type { Queryable } from '../../db/pool';

export interface PlatformStats {
  companies: Record<string, number>;
  users: number;
  trips: number;
  shipmentsTotal: number;
  shipmentsByStatus: Record<string, number>;
  totalRevenue: number;
  /** Last 14 days, oldest first, days in Asia/Damascus; zero-filled. */
  shipmentsPerDay: { day: string; count: number }[];
  /** Cash on delivery: collected in total vs the part already settled. */
  cod: { collected: number; settled: number; pending: number };
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
      const [companies, shipments, totals, perDay, cod] = await Promise.all([
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
        db.query<{ day: string; count: number }>(
          `SELECT to_char(d.day, 'YYYY-MM-DD') AS day, count(s.id)::int AS count
             FROM generate_series(
                    (now() AT TIME ZONE 'Asia/Damascus')::date - 13,
                    (now() AT TIME ZONE 'Asia/Damascus')::date,
                    interval '1 day') AS d(day)
             LEFT JOIN shipments s
               ON (s.created_at AT TIME ZONE 'Asia/Damascus')::date = d.day::date
            GROUP BY d.day ORDER BY d.day`,
        ),
        db.query<{ collected: number; settled: number }>(
          `SELECT COALESCE(sum(amount), 0)::float AS collected,
                  COALESCE(sum(amount) FILTER (WHERE settled), 0)::float AS settled
             FROM collections`,
        ),
      ]);
      const codRow = cod.rows[0] ?? { collected: 0, settled: 0 };
      const byStatus = toMap(shipments.rows);
      const row = totals.rows[0] ?? { users: 0, trips: 0, revenue: 0 };
      return {
        companies: toMap(companies.rows),
        users: row.users,
        trips: row.trips,
        shipmentsTotal: Object.values(byStatus).reduce((a, b) => a + b, 0),
        shipmentsByStatus: byStatus,
        totalRevenue: row.revenue,
        shipmentsPerDay: perDay.rows,
        cod: {
          collected: codRow.collected,
          settled: codRow.settled,
          pending: codRow.collected - codRow.settled,
        },
      };
    },
  };
}
