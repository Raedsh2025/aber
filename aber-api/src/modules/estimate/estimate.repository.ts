import type { Queryable } from '../../db/pool';

export interface RouteEstimateRow {
  base_price: number;
  price_per_kg: number;
  est_hours: number;
}

export interface GovernorateDto {
  code: string;
  nameAr: string;
}

export interface EstimateRepository {
  findRoute(from: string, to: string): Promise<RouteEstimateRow | undefined>;
  /** Only governorates that appear in route_prices. */
  listPricedGovernorates(): Promise<GovernorateDto[]>;
}

// Repository: SQL only. numeric columns are cast to float because pg returns them as strings.
export function createEstimateRepository(db: Queryable): EstimateRepository {
  return {
    async findRoute(from, to) {
      const { rows } = await db.query<RouteEstimateRow>(
        `SELECT base_price::float AS base_price, price_per_kg::float AS price_per_kg,
                est_hours::float AS est_hours
           FROM route_prices WHERE from_governorate = $1 AND to_governorate = $2`,
        [from, to],
      );
      return rows[0];
    },
    async listPricedGovernorates() {
      const { rows } = await db.query<GovernorateDto>(
        `SELECT g.code, g.name_ar AS "nameAr"
           FROM governorates g
          WHERE g.code IN (SELECT from_governorate FROM route_prices
                           UNION SELECT to_governorate FROM route_prices)
          ORDER BY g.name_ar`,
      );
      return rows;
    },
  };
}
