import type { Queryable } from '../../db/pool';
import type { TripStatus } from '../../shared/domain/tripStatus';
import type { ManifestRow } from './manifest';
import type { TripListQuery } from './trip.schema';

export type ScanType = 'load' | 'arrive';

export interface TripDto {
  id: string;
  companyId: string;
  fromBranchId: string;
  toBranchId: string;
  driverId: string | null;
  vehicleId: string | null;
  departureAt: string;
  estimatedArrivalAt: string | null;
  capacityKg: number;
  status: TripStatus;
  loadedKg: number;
  freeKg: number;
  shipmentsCount: number;
}

export interface TripSuggestion {
  id: string;
  departureAt: string;
  freeKg: number;
}

export interface NewTrip {
  companyId: string;
  fromBranchId: string;
  toBranchId: string;
  driverId: string | null;
  vehicleId: string | null;
  departureAt: Date;
  estimatedArrivalAt: Date | null;
  capacityKg: number;
}

export interface TripRepository {
  findById(id: string, lock?: boolean): Promise<TripDto | undefined>;
  list(filters: TripListQuery, companyId: string, driverId: string | null): Promise<TripDto[]>;
  suggest(companyId: string, from: string, to: string, weightKg: number): Promise<TripSuggestion[]>;
  insert(trip: NewTrip): Promise<string>;
  updateStatus(id: string, status: TripStatus): Promise<void>;
  findBranchCompanies(ids: string[]): Promise<{ id: string; company_id: string }[]>;
  findDriver(
    id: string,
  ): Promise<{ company_id: string | null; role: string; is_active: boolean } | undefined>;
  findVehicle(
    id: string,
  ): Promise<{ company_id: string; capacity_kg: number; is_active: boolean } | undefined>;
  assignShipment(tripId: string, shipmentId: string): Promise<void>;
  hasScan(tripId: string, shipmentId: string, type: ScanType): Promise<boolean>;
  insertScan(tripId: string, shipmentId: string, type: ScanType, by: string): Promise<void>;
  manifest(tripId: string): Promise<ManifestRow[]>;
}

// Capacity numbers come from the v_trip_load view (blueprint section 8).
const SELECT = `
  SELECT t.id, t.company_id AS "companyId", t.from_branch_id AS "fromBranchId",
         t.to_branch_id AS "toBranchId", t.driver_id AS "driverId", t.vehicle_id AS "vehicleId",
         t.departure_at AS "departureAt", t.estimated_arrival_at AS "estimatedArrivalAt",
         t.capacity_kg::float AS "capacityKg", t.status,
         v.loaded_kg::float AS "loadedKg", v.free_kg::float AS "freeKg",
         v.shipments_count::int AS "shipmentsCount"
    FROM trips t
    JOIN v_trip_load v ON v.trip_id = t.id`;

const LIST_LIMIT = 200;
const SUGGEST_LIMIT = 3;

// Repository: SQL only. No business rules here.
export function createTripRepository(db: Queryable): TripRepository {
  return {
    async findById(id, lock = false) {
      // The view cannot be locked, so the trips row is locked first when requested.
      if (lock) await db.query('SELECT id FROM trips WHERE id = $1 FOR UPDATE', [id]);
      const { rows } = await db.query<TripDto>(`${SELECT} WHERE t.id = $1`, [id]);
      return rows[0];
    },

    async list(filters, companyId, driverId) {
      const where = ['t.company_id = $1'];
      const values: unknown[] = [companyId];
      if (filters.status) {
        values.push(filters.status);
        where.push(`t.status = $${values.length}`);
      }
      if (driverId) {
        values.push(driverId);
        where.push(`t.driver_id = $${values.length}`);
      }
      const { rows } = await db.query<TripDto>(
        `${SELECT} WHERE ${where.join(' AND ')} ORDER BY t.departure_at DESC LIMIT ${LIST_LIMIT}`,
        values,
      );
      return rows;
    },

    async suggest(companyId, from, to, weightKg) {
      const { rows } = await db.query<TripSuggestion>(
        `SELECT t.id, t.departure_at AS "departureAt", v.free_kg::float AS "freeKg"
           FROM trips t
           JOIN v_trip_load v ON v.trip_id = t.id
          WHERE t.company_id = $1 AND t.from_branch_id = $2 AND t.to_branch_id = $3
            AND t.status IN ('scheduled','loading')
            AND t.departure_at > now()
            AND v.free_kg >= $4
          ORDER BY t.departure_at ASC, v.free_kg ASC
          LIMIT ${SUGGEST_LIMIT}`,
        [companyId, from, to, weightKg],
      );
      return rows;
    },

    async insert(t) {
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO trips (company_id, from_branch_id, to_branch_id, driver_id, vehicle_id,
                            departure_at, estimated_arrival_at, capacity_kg)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          t.companyId,
          t.fromBranchId,
          t.toBranchId,
          t.driverId,
          t.vehicleId,
          t.departureAt,
          t.estimatedArrivalAt,
          t.capacityKg,
        ],
      );
      const row = rows[0];
      if (!row) throw new Error('Insert did not return an id');
      return row.id;
    },

    async updateStatus(id, status) {
      await db.query('UPDATE trips SET status = $2::trip_status WHERE id = $1', [id, status]);
    },

    async findBranchCompanies(ids) {
      const { rows } = await db.query<{ id: string; company_id: string }>(
        'SELECT id, company_id FROM branches WHERE id = ANY($1::uuid[])',
        [ids],
      );
      return rows;
    },

    async findDriver(id) {
      const { rows } = await db.query<{
        company_id: string | null;
        role: string;
        is_active: boolean;
      }>('SELECT company_id, role, is_active FROM users WHERE id = $1', [id]);
      return rows[0];
    },

    async findVehicle(id) {
      const { rows } = await db.query<{
        company_id: string;
        capacity_kg: number;
        is_active: boolean;
      }>(
        'SELECT company_id, capacity_kg::float AS capacity_kg, is_active FROM vehicles WHERE id = $1',
        [id],
      );
      return rows[0];
    },

    async assignShipment(tripId, shipmentId) {
      await db.query('UPDATE shipments SET trip_id = $1, updated_at = now() WHERE id = $2', [
        tripId,
        shipmentId,
      ]);
    },

    async hasScan(tripId, shipmentId, type) {
      const { rows } = await db.query(
        `SELECT 1 FROM manifest_scans
          WHERE trip_id = $1 AND shipment_id = $2 AND scan_type = $3::scan_type`,
        [tripId, shipmentId, type],
      );
      return rows.length > 0;
    },

    async insertScan(tripId, shipmentId, type, by) {
      await db.query(
        `INSERT INTO manifest_scans (trip_id, shipment_id, scan_type, scanned_by)
         VALUES ($1,$2,$3::scan_type,$4) ON CONFLICT (trip_id, shipment_id, scan_type) DO NOTHING`,
        [tripId, shipmentId, type, by],
      );
    },

    async manifest(tripId) {
      const { rows } = await db.query<ManifestRow>(
        `SELECT s.id, s.tracking_number AS "trackingNumber", s.weight_kg::float AS "weightKg",
                s.status,
                EXISTS (SELECT 1 FROM manifest_scans m
                         WHERE m.trip_id = $1 AND m.shipment_id = s.id AND m.scan_type = 'load') AS loaded,
                EXISTS (SELECT 1 FROM manifest_scans m
                         WHERE m.trip_id = $1 AND m.shipment_id = s.id AND m.scan_type = 'arrive') AS arrived
           FROM shipments s WHERE s.trip_id = $1 ORDER BY s.tracking_number`,
        [tripId],
      );
      return rows;
    },
  };
}
