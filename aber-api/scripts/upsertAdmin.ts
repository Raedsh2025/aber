import type { Queryable } from '../src/db/pool';

export type UpsertAdminOutcome = 'created' | 'updated';

// users has a unique index on lower(email), so the conflict target is that expression.
// xmax = 0 is true only for a freshly inserted row, which tells "created" from "updated".
// The update touches only the password, the active flag and updated_at, and only when the
// existing account already is a system_admin, so no other account can be overwritten.
const UPSERT_ADMIN_SQL = `
  INSERT INTO users (full_name, email, password_hash, role)
  VALUES ('System Administrator', $1, $2, 'system_admin')
  ON CONFLICT (lower(email)) DO UPDATE
     SET password_hash = EXCLUDED.password_hash,
         is_active     = true,
         updated_at    = now()
   WHERE users.role = 'system_admin'
  RETURNING (xmax = 0) AS inserted`;

export async function upsertAdmin(
  db: Queryable,
  email: string,
  passwordHash: string,
): Promise<UpsertAdminOutcome> {
  const { rows } = await db.query<{ inserted: boolean }>(UPSERT_ADMIN_SQL, [email, passwordHash]);
  const row = rows[0];
  // No row back means the email belongs to an account that is not a system_admin.
  if (!row) {
    throw new Error(
      'This email belongs to an account that is not a system_admin. Nothing changed.',
    );
  }
  return row.inserted ? 'created' : 'updated';
}
