import type { Queryable } from '../../db/pool';
import type { ShipmentStatus } from '../../shared/domain/shipmentStatus';

export interface MyShipmentDto {
  trackingNumber: string;
  status: ShipmentStatus;
  originGovernorate: string;
  destGovernorate: string;
  createdAt: string;
}

export interface AccountRepository {
  findPhoneByUserId(userId: string): Promise<string | null>;
  /** Shipments where the phone is the sender or the receiver. Minimal fields only. */
  listShipmentsForPhone(phoneDigits: string): Promise<MyShipmentDto[]>;
}

const LIST_LIMIT = 100;

// Repository: SQL only. No business rules here.
export function createAccountRepository(db: Queryable): AccountRepository {
  return {
    async findPhoneByUserId(userId) {
      const { rows } = await db.query<{ phone: string | null }>(
        'SELECT phone FROM users WHERE id = $1',
        [userId],
      );
      return rows[0]?.phone ?? null;
    },
    async listShipmentsForPhone(phoneDigits) {
      const { rows } = await db.query<MyShipmentDto>(
        `SELECT s.tracking_number AS "trackingNumber", s.status,
                og.name_ar AS "originGovernorate", dg.name_ar AS "destGovernorate",
                s.created_at AS "createdAt"
           FROM shipments s
           JOIN branches ob ON ob.id = s.origin_branch_id
           JOIN governorates og ON og.code = ob.governorate_code
           JOIN branches dbr ON dbr.id = s.dest_branch_id
           JOIN governorates dg ON dg.code = dbr.governorate_code
          WHERE regexp_replace(s.sender_phone, '[^0-9]', '', 'g') = $1
             OR regexp_replace(s.receiver_phone, '[^0-9]', '', 'g') = $1
          ORDER BY s.created_at DESC
          LIMIT $2`,
        [phoneDigits, LIST_LIMIT],
      );
      return rows;
    },
  };
}
