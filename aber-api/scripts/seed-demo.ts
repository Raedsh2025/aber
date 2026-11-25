import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import { pool } from '../src/db/pool';
import {
  BRANCHES,
  DEMO_COMPANY,
  DEMO_OTP,
  ROUTES,
  SENDER_PREFIX,
  SHIPMENTS,
  TRIPS,
  USERS,
  VEHICLES,
  historyOf,
  priceFor,
  type BranchKey,
  type TripKey,
} from './demoPlan';

// Usage (PowerShell):
//   $env:DEMO_PASSWORD="<password you choose>"; npm run seed:demo
// Safe to run again: reference data uses "insert if missing", and the demo trips and
// shipments are created only when no demo shipment exists yet.
// Existing accounts keep their password unless DEMO_RESET_PASSWORDS=true.

const BCRYPT_COST = 12;
const hours = (n: number): string => `${n} hours`;

async function one(client: PoolClient, sql: string, values: unknown[]): Promise<string> {
  const res = await client.query<{ id: string }>(sql, values);
  const row = res.rows[0];
  if (!row) throw new Error(`Expected a row from: ${sql.slice(0, 40)}`);
  return row.id;
}

async function main(): Promise<void> {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('Set DEMO_PASSWORD (at least 8 characters) in your shell first.');
  }
  const reset = process.env.DEMO_RESET_PASSWORDS === 'true';
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const otpHash = createHash('sha256').update(DEMO_OTP).digest('hex');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Company (approved) and branches.
    const existingCompany = await client.query<{ id: string }>(
      'SELECT id FROM companies WHERE name = $1 LIMIT 1',
      [DEMO_COMPANY],
    );
    const companyId =
      existingCompany.rows[0]?.id ??
      (await one(
        client,
        `INSERT INTO companies (name, status) VALUES ($1, 'approved') RETURNING id`,
        [DEMO_COMPANY],
      ));
    await client.query(`UPDATE companies SET status = 'approved' WHERE id = $1`, [companyId]);

    const branchIds = {} as Record<BranchKey, string>;
    for (const b of BRANCHES) {
      const found = await client.query<{ id: string }>(
        'SELECT id FROM branches WHERE company_id = $1 AND governorate_code = $2 ORDER BY created_at LIMIT 1',
        [companyId, b.key],
      );
      branchIds[b.key] =
        found.rows[0]?.id ??
        (await one(
          client,
          `INSERT INTO branches (company_id, governorate_code, name, address)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [companyId, b.key, b.name, b.address],
        ));
    }

    // Route prices for every pair.
    for (const r of ROUTES) {
      await client.query(
        `INSERT INTO route_prices (from_governorate, to_governorate, base_price, price_per_kg, est_hours)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [r.from, r.to, r.base, r.perKg, r.hours],
      );
    }

    // Accounts: one per role.
    const userIds: Record<string, string> = {};
    for (const u of USERS) {
      const found = await client.query<{ id: string }>(
        'SELECT id FROM users WHERE lower(email) = lower($1)',
        [u.email],
      );
      let id = found.rows[0]?.id;
      if (id) {
        if (reset) {
          await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
            passwordHash,
            id,
          ]);
        }
      } else {
        id = await one(
          client,
          `INSERT INTO users (company_id, branch_id, full_name, email, password_hash, role)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [
            u.role === 'system_admin' ? null : companyId,
            u.branch ? branchIds[u.branch] : null,
            u.name,
            u.email,
            passwordHash,
            u.role,
          ],
        );
      }
      userIds[u.key] = id;
    }
    const manager = userIds.manager!;
    const driver = userIds.driver!;
    const staffFor = (b: BranchKey): string =>
      b === 'DAM' ? userIds.staffDam! : b === 'ALP' ? userIds.staffAlp! : manager;

    // Vehicles.
    const vehicleIds: string[] = [];
    for (const v of VEHICLES) {
      await client.query(
        `INSERT INTO vehicles (company_id, plate_number, capacity_kg)
         VALUES ($1, $2, $3) ON CONFLICT (company_id, plate_number) DO NOTHING`,
        [companyId, v.plate, v.capacityKg],
      );
      const found = await client.query<{ id: string }>(
        'SELECT id FROM vehicles WHERE company_id = $1 AND plate_number = $2',
        [companyId, v.plate],
      );
      vehicleIds.push(found.rows[0]!.id);
    }

    // Demo trips and shipments: only when none exist yet (this is what makes it idempotent).
    const marker = await client.query(
      'SELECT 1 FROM shipments WHERE company_id = $1 AND sender_name LIKE $2 LIMIT 1',
      [companyId, `${SENDER_PREFIX}%`],
    );
    if (marker.rowCount === 0) {
      const tripIds = {} as Record<TripKey, string>;
      for (const t of TRIPS) {
        const capacity = VEHICLES[t.vehicle]!.capacityKg;
        tripIds[t.key] = await one(
          client,
          `INSERT INTO trips (company_id, from_branch_id, to_branch_id, driver_id, vehicle_id,
                              departure_at, estimated_arrival_at, capacity_kg, status)
           VALUES ($1, $2, $3, $4, $5,
                   now() + $6::interval, now() + $6::interval + interval '4 hours', $7, $8)
           RETURNING id`,
          [
            companyId,
            branchIds[t.from],
            branchIds[t.to],
            driver,
            vehicleIds[t.vehicle],
            hours(t.departHours),
            capacity,
            t.status,
          ],
        );
      }

      let n = 0;
      for (const s of SHIPMENTS) {
        n += 1;
        const delivered = s.status === 'delivered';
        const shipmentId = await one(
          client,
          `INSERT INTO shipments
             (company_id, origin_branch_id, dest_branch_id, trip_id, sender_name, sender_phone,
              receiver_name, receiver_phone, goods_type, weight_kg, price, cod_amount, status,
              delivery_otp_hash, created_by, created_at, updated_at, delivered_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                   now() - $16::interval, now() - $16::interval,
                   CASE WHEN $17 THEN now() - $16::interval + interval '30 hours' END)
           RETURNING id`,
          [
            companyId,
            branchIds[s.from],
            branchIds[s.to],
            s.trip ? tripIds[s.trip] : null,
            `${SENDER_PREFIX} ${n}`,
            `0933${String(n).padStart(6, '0')}`,
            `مستلم تجريبي ${n}`,
            `0944${String(n).padStart(6, '0')}`,
            s.goods,
            s.weightKg,
            priceFor(s),
            s.cod,
            s.status,
            otpHash,
            staffFor(s.from),
            `${s.daysAgo * 24 + 1} hours`,
            delivered,
          ],
        );

        const path = historyOf(s.status);
        for (const [i, status] of path.entries()) {
          await client.query(
            `INSERT INTO shipment_status_log (shipment_id, status, changed_by, changed_at)
             VALUES ($1, $2, $3, now() - $4::interval + $5::interval)`,
            [
              shipmentId,
              status,
              i === 0 ? staffFor(s.from) : driver,
              `${s.daysAgo * 24 + 1} hours`,
              `${i * 8} hours`,
            ],
          );
        }

        if (s.trip) {
          const tripId = tripIds[s.trip];
          await client.query(
            `INSERT INTO manifest_scans (trip_id, shipment_id, scan_type, scanned_by)
             VALUES ($1, $2, 'load', $3) ON CONFLICT DO NOTHING`,
            [tripId, shipmentId, driver],
          );
          if (s.status === 'arrived' || delivered) {
            await client.query(
              `INSERT INTO manifest_scans (trip_id, shipment_id, scan_type, scanned_by)
               VALUES ($1, $2, 'arrive', $3) ON CONFLICT DO NOTHING`,
              [tripId, shipmentId, driver],
            );
          }
        }

        // Cash on delivery is collected on delivery; every second one is already settled.
        if (delivered && s.cod > 0) {
          const settled = n % 2 === 0;
          await client.query(
            `INSERT INTO collections (shipment_id, branch_id, amount, collected_by, settled, settled_at)
             VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 THEN now() END)`,
            [shipmentId, branchIds[s.to], s.cod, manager, settled],
          );
        }
      }
      console.log(`created ${TRIPS.length} trips and ${SHIPMENTS.length} demo shipments`);
    } else {
      console.log('demo shipments already exist: trips and shipments were not touched');
    }

    await client.query('COMMIT');
    console.log('demo data ready. Accounts:');
    for (const u of USERS) console.log(`  ${u.role.padEnd(14)} ${u.email}`);
    console.log(`Delivery code (OTP) of every demo shipment: ${DEMO_OTP}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
