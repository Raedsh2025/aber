import type { Queryable } from '../../db/pool';
import type { ShipmentStatus } from '../../shared/domain/shipmentStatus';
import type { CreateShipmentBody, ListQuery } from './shipment.schema';

export type GoodsType = 'normal' | 'fragile' | 'refrigerated';

export interface ShipmentDto {
  id: string;
  trackingNumber: string;
  companyId: string;
  originBranchId: string;
  destBranchId: string;
  tripId: string | null;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  goodsType: GoodsType;
  weightKg: number;
  price: number;
  codAmount: number;
  status: ShipmentStatus;
  createdAt: string;
}

export interface BranchRow {
  id: string;
  company_id: string;
  governorate_code: string;
}

export interface RoutePriceRow {
  base_price: number;
  price_per_kg: number;
  est_hours: number;
}

export interface NewShipment extends CreateShipmentBody {
  companyId: string;
  price: number;
  otpHash: string;
  createdBy: string;
}

export interface NewCollection {
  shipmentId: string;
  branchId: string;
  amount: number;
  collectedBy: string;
}

export interface PublicTracking {
  trackingNumber: string;
  status: ShipmentStatus;
  originGovernorate: string;
  destGovernorate: string;
  history: { status: ShipmentStatus; changedAt: string; note: string | null }[];
}

export interface ShipmentRepository {
  findById(id: string, lock?: boolean): Promise<ShipmentDto | undefined>;
  findByTracking(trackingNumber: string): Promise<ShipmentDto | undefined>;
  list(filters: ListQuery, companyId: string | null): Promise<ShipmentDto[]>;
  findBranches(ids: string[]): Promise<BranchRow[]>;
  findRoutePrice(from: string, to: string): Promise<RoutePriceRow | undefined>;
  insert(data: NewShipment): Promise<string>;
  updateStatus(id: string, status: ShipmentStatus): Promise<void>;
  insertLog(
    shipmentId: string,
    status: ShipmentStatus,
    note: string | null,
    by: string | null,
  ): Promise<void>;
  getOtpState(id: string): Promise<{ hash: string; attempts: number } | undefined>;
  bumpOtpAttempts(id: string): Promise<void>;
  insertCollection(collection: NewCollection): Promise<void>;
  publicTracking(trackingNumber: string): Promise<PublicTracking | undefined>;
}

const LIST_LIMIT = 200;

// Aliases turn snake_case columns into camelCase directly in SQL.
const SELECT = `
  SELECT s.id, s.tracking_number AS "trackingNumber", s.company_id AS "companyId",
         s.origin_branch_id AS "originBranchId", s.dest_branch_id AS "destBranchId",
         s.trip_id AS "tripId", s.sender_name AS "senderName", s.sender_phone AS "senderPhone",
         s.receiver_name AS "receiverName", s.receiver_phone AS "receiverPhone",
         s.goods_type AS "goodsType", s.weight_kg::float AS "weightKg",
         s.price::float AS price, s.cod_amount::float AS "codAmount",
         s.status, s.created_at AS "createdAt"
    FROM shipments s`;

// Repository: SQL only. No business rules here.
export function createShipmentRepository(db: Queryable): ShipmentRepository {
  return {
    async findById(id, lock = false) {
      const { rows } = await db.query<ShipmentDto>(
        `${SELECT} WHERE s.id = $1 ${lock ? 'FOR UPDATE OF s' : ''}`,
        [id],
      );
      return rows[0];
    },

    async findByTracking(trackingNumber) {
      const { rows } = await db.query<ShipmentDto>(`${SELECT} WHERE s.tracking_number = $1`, [
        trackingNumber,
      ]);
      return rows[0];
    },

    async list(filters, companyId) {
      const where: string[] = [];
      const values: unknown[] = [];
      // "?" in the SQL piece is replaced with the next $n placeholder. Values are never concatenated.
      const add = (sql: string, value: unknown): void => {
        values.push(value);
        where.push(sql.replaceAll('?', `$${values.length}`));
      };

      if (companyId) add('s.company_id = ?', companyId);
      if (filters.status) add('s.status = ?', filters.status);
      if (filters.tripId) add('s.trip_id = ?', filters.tripId);
      if (filters.branchId) {
        add('(s.origin_branch_id = ? OR s.dest_branch_id = ?)', filters.branchId);
      }
      if (filters.search) {
        add('(s.tracking_number ILIKE ? OR s.receiver_name ILIKE ?)', `%${filters.search}%`);
      }

      const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const { rows } = await db.query<ShipmentDto>(
        `${SELECT} ${clause} ORDER BY s.created_at DESC LIMIT ${LIST_LIMIT}`,
        values,
      );
      return rows;
    },

    async findBranches(ids) {
      const { rows } = await db.query<BranchRow>(
        'SELECT id, company_id, governorate_code FROM branches WHERE id = ANY($1::uuid[])',
        [ids],
      );
      return rows;
    },

    async findRoutePrice(from, to) {
      const { rows } = await db.query<RoutePriceRow>(
        `SELECT base_price::float AS base_price, price_per_kg::float AS price_per_kg,
                est_hours::float AS est_hours
           FROM route_prices WHERE from_governorate = $1 AND to_governorate = $2`,
        [from, to],
      );
      return rows[0];
    },

    async insert(d) {
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO shipments
           (company_id, origin_branch_id, dest_branch_id, sender_name, sender_phone,
            receiver_name, receiver_phone, goods_type, weight_kg, price, cod_amount,
            delivery_otp_hash, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [
          d.companyId,
          d.originBranchId,
          d.destBranchId,
          d.senderName,
          d.senderPhone,
          d.receiverName,
          d.receiverPhone,
          d.goodsType,
          d.weightKg,
          d.price,
          d.codAmount,
          d.otpHash,
          d.createdBy,
        ],
      );
      const row = rows[0];
      if (!row) throw new Error('Insert did not return an id');
      return row.id;
    },

    async updateStatus(id, status) {
      await db.query(
        `UPDATE shipments
            SET status = $2::shipment_status,
                delivered_at = CASE WHEN $2::shipment_status = 'delivered' THEN now() ELSE delivered_at END,
                updated_at = now()
          WHERE id = $1`,
        [id, status],
      );
    },

    async insertLog(shipmentId, status, note, by) {
      await db.query(
        `INSERT INTO shipment_status_log (shipment_id, status, note, changed_by)
         VALUES ($1,$2,$3,$4)`,
        [shipmentId, status, note, by],
      );
    },

    async getOtpState(id) {
      const { rows } = await db.query<{ hash: string; attempts: number }>(
        'SELECT delivery_otp_hash AS hash, otp_attempts AS attempts FROM shipments WHERE id = $1',
        [id],
      );
      return rows[0];
    },

    async bumpOtpAttempts(id) {
      await db.query('UPDATE shipments SET otp_attempts = otp_attempts + 1 WHERE id = $1', [id]);
    },

    async insertCollection(c) {
      await db.query(
        `INSERT INTO collections (shipment_id, branch_id, amount, collected_by)
         VALUES ($1,$2,$3,$4) ON CONFLICT (shipment_id) DO NOTHING`,
        [c.shipmentId, c.branchId, c.amount, c.collectedBy],
      );
    },

    async publicTracking(trackingNumber) {
      const head = await db.query<{
        id: string;
        trackingNumber: string;
        status: ShipmentStatus;
        originGovernorate: string;
        destGovernorate: string;
      }>(
        `SELECT s.id, s.tracking_number AS "trackingNumber", s.status,
                og.name_ar AS "originGovernorate", dg.name_ar AS "destGovernorate"
           FROM shipments s
           JOIN branches ob ON ob.id = s.origin_branch_id
           JOIN governorates og ON og.code = ob.governorate_code
           JOIN branches dbr ON dbr.id = s.dest_branch_id
           JOIN governorates dg ON dg.code = dbr.governorate_code
          WHERE s.tracking_number = $1`,
        [trackingNumber],
      );
      const row = head.rows[0];
      if (!row) return undefined;

      const history = await db.query<PublicTracking['history'][number]>(
        `SELECT status, changed_at AS "changedAt", note
           FROM shipment_status_log WHERE shipment_id = $1 ORDER BY changed_at ASC`,
        [row.id],
      );
      // Public tracking never exposes names, phones, prices or internal ids.
      return {
        trackingNumber: row.trackingNumber,
        status: row.status,
        originGovernorate: row.originGovernorate,
        destGovernorate: row.destGovernorate,
        history: history.rows,
      };
    },
  };
}
