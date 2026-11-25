import type { Queryable } from '../../db/pool';

export interface VehicleDto {
  id: string;
  plateNumber: string;
  capacityKg: number;
  isActive: boolean;
}

export interface NewVehicle {
  companyId: string;
  plateNumber: string;
  capacityKg: number;
}

export interface VehicleRepository {
  listByCompany(companyId: string): Promise<VehicleDto[]>;
  /** Returns undefined when the plate already exists in the company. */
  insert(vehicle: NewVehicle): Promise<VehicleDto | undefined>;
}

const COLUMNS = `id, plate_number AS "plateNumber", capacity_kg::float AS "capacityKg", is_active AS "isActive"`;

// Repository: SQL only. No business rules here.
export function createVehicleRepository(db: Queryable): VehicleRepository {
  return {
    async listByCompany(companyId) {
      const { rows } = await db.query<VehicleDto>(
        `SELECT ${COLUMNS} FROM vehicles WHERE company_id = $1 ORDER BY plate_number`,
        [companyId],
      );
      return rows;
    },
    async insert(v) {
      const { rows } = await db.query<VehicleDto>(
        `INSERT INTO vehicles (company_id, plate_number, capacity_kg)
         VALUES ($1, $2, $3)
         ON CONFLICT (company_id, plate_number) DO NOTHING
         RETURNING ${COLUMNS}`,
        [v.companyId, v.plateNumber, v.capacityKg],
      );
      return rows[0];
    },
  };
}
