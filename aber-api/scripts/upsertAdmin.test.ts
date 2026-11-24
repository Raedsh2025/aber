import type { QueryResult } from 'pg';
import { describe, expect, it } from 'vitest';
import type { Queryable } from '../src/db/pool';
import { upsertAdmin } from './upsertAdmin';

// Fake database: records the query and returns the rows we choose. No real database is used.
function fakeDb(rows: { inserted: boolean }[]): Queryable & { calls: [string, unknown[]][] } {
  const calls: [string, unknown[]][] = [];
  return {
    calls,
    query: (text: string, values: unknown[] = []) => {
      calls.push([text, values]);
      return Promise.resolve({ rows } as unknown as QueryResult<never>);
    },
  };
}

describe('upsertAdmin', () => {
  it('reports created for a new row', async () => {
    const db = fakeDb([{ inserted: true }]);
    expect(await upsertAdmin(db, 'a@example.test', 'hash')).toBe('created');
  });

  it('reports updated when the email already existed', async () => {
    const db = fakeDb([{ inserted: false }]);
    expect(await upsertAdmin(db, 'a@example.test', 'hash')).toBe('updated');
  });

  it('refuses to touch an account that is not a system_admin', async () => {
    const db = fakeDb([]);
    await expect(upsertAdmin(db, 'a@example.test', 'hash')).rejects.toThrow('not a system_admin');
  });

  it('uses the lower(email) conflict target and limits what is updated', async () => {
    const db = fakeDb([{ inserted: true }]);
    await upsertAdmin(db, 'A@Example.test', 'hash');
    const [sql, values] = db.calls[0];
    expect(sql).toContain('ON CONFLICT (lower(email)) DO UPDATE');
    expect(sql).toContain('password_hash = EXCLUDED.password_hash');
    expect(sql).toContain('is_active     = true');
    expect(sql).toContain('updated_at    = now()');
    expect(sql).toContain("WHERE users.role = 'system_admin'");
    expect(sql).not.toMatch(/full_name\s*=|role\s*=\s*EXCLUDED/);
    expect(values).toEqual(['A@Example.test', 'hash']);
  });
});
