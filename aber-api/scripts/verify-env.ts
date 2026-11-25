import 'dotenv/config';
import { Pool } from 'pg';
import { formatReport, missingPairs, tablesWithoutRls, type CheckResult } from './verifyLogic';

// Read-only checks against YOUR database and YOUR deployed API. See docs/VERIFY.md.
// It only runs SELECT statements and a few HTTP requests. It never writes anything.
//
// Environment variables:
//   DATABASE_URL, DATABASE_SSL        database checks (skipped with a FAIL if DATABASE_URL is missing)
//   API_URL                           e.g. https://your-api.example.com (no trailing slash, no /api)
//   VERIFY_LOGIN_EMAIL, VERIFY_LOGIN_PASSWORD   a demo account for the login smoke test
//   VERIFY_TRACKING_NUMBER            a tracking number for the public tracking smoke test

const results: CheckResult[] = [];
const record = (name: string, ok: boolean, detail = ''): void => {
  results.push({ name, ok, detail });
};

async function databaseChecks(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    record('database: DATABASE_URL is set', false, 'missing');
    return;
  }
  const pool = new Pool({
    connectionString: url,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 1,
  });
  try {
    await pool.query('select 1');
    record('database: connection', true);

    const daily = await pool.query<{
      day: string;
      branch: string;
      shipments_count: number;
      revenue: string;
    }>(
      `SELECT to_char(v.day, 'YYYY-MM-DD') AS day, b.name AS branch,
              v.shipments_count::int AS shipments_count, v.revenue::text AS revenue
         FROM v_branch_daily_report v JOIN branches b ON b.id = v.branch_id
        ORDER BY v.day DESC, b.name LIMIT 30`,
    );
    console.log('\nv_branch_daily_report (Damascus date, newest first, max 30 rows):');
    if (daily.rows.length === 0) console.log('  (no rows)');
    for (const r of daily.rows) {
      console.log(`  ${r.day}  ${r.branch}  shipments=${r.shipments_count}  revenue=${r.revenue}`);
    }
    // Cross-check the view's day against an independent Damascus conversion.
    const mismatch = await pool.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM (
         SELECT (created_at AT TIME ZONE 'Asia/Damascus')::date AS d, origin_branch_id, count(*) AS c
           FROM shipments GROUP BY 1, 2) x
         FULL JOIN v_branch_daily_report v
           ON v.day = x.d AND v.branch_id = x.origin_branch_id AND v.shipments_count = x.c
        WHERE v.day IS NULL OR x.d IS NULL`,
    );
    record(
      'database: v_branch_daily_report matches Damascus-date grouping',
      (mismatch.rows[0]?.n ?? 1) === 0,
      `${daily.rows.length} recent rows printed above`,
    );

    const rls = await pool.query<{ table: string; rls: boolean }>(
      `SELECT c.relname AS "table", c.relrowsecurity AS rls
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname`,
    );
    const noRls = tablesWithoutRls(rls.rows);
    record(
      `database: RLS enabled on all ${rls.rows.length} tables`,
      rls.rows.length > 0 && noRls.length === 0,
      noRls.length ? `without RLS: ${noRls.join(', ')}` : '',
    );

    const grants = await pool.query<{
      grantee: string;
      table_name: string;
      privilege_type: string;
    }>(
      `SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
        WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
        ORDER BY grantee, table_name LIMIT 20`,
    );
    record(
      'database: anon and authenticated have no table privileges',
      grants.rows.length === 0,
      grants.rows.length
        ? `e.g. ${grants.rows
            .map((g) => `${g.grantee}:${g.privilege_type} on ${g.table_name}`)
            .slice(0, 3)
            .join('; ')}`
        : '',
    );

    const gov = await pool.query<{ code: string }>(
      `SELECT DISTINCT governorate_code AS code FROM branches WHERE is_active`,
    );
    const priced = await pool.query<{ from: string; to: string }>(
      `SELECT from_governorate AS "from", to_governorate AS "to" FROM route_prices`,
    );
    const missing = missingPairs(
      gov.rows.map((g) => g.code),
      priced.rows,
    );
    record(
      'database: route_prices covers every pair of branch governorates',
      missing.length === 0,
      missing.length
        ? `missing: ${missing.map(([a, b]) => `${a}->${b}`).join(', ')}`
        : `${gov.rows.length} governorates`,
    );
  } catch (error) {
    record('database: checks ran', false, error instanceof Error ? error.message : String(error));
  } finally {
    await pool.end();
  }
}

async function get(url: string): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function apiChecks(): Promise<void> {
  const base = process.env.API_URL?.replace(/\/+$/, '');
  if (!base) {
    record('api: API_URL is set', false, 'missing');
    return;
  }
  const attempt = async (
    name: string,
    run: () => Promise<{ ok: boolean; detail: string }>,
  ): Promise<void> => {
    try {
      const r = await run();
      record(name, r.ok, r.detail);
    } catch (error) {
      record(name, false, error instanceof Error ? error.message : String(error));
    }
  };

  await attempt('api: GET /health', async () => {
    const r = await get(`${base}/health`);
    return { ok: r.status === 200, detail: `status ${r.status}` };
  });
  await attempt('api: GET /health/db', async () => {
    const r = await get(`${base}/health/db`);
    return { ok: r.status === 200, detail: `status ${r.status}` };
  });

  const email = process.env.VERIFY_LOGIN_EMAIL;
  const password = process.env.VERIFY_LOGIN_PASSWORD;
  if (!email || !password) {
    record(
      'api: POST /api/auth/login',
      false,
      'VERIFY_LOGIN_EMAIL / VERIFY_LOGIN_PASSWORD not set',
    );
  } else {
    await attempt('api: POST /api/auth/login', async () => {
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(30_000),
      });
      const body = (await res.json().catch(() => null)) as { data?: { token?: string } } | null;
      return {
        ok: res.status === 200 && typeof body?.data?.token === 'string',
        detail: `status ${res.status}`,
      };
    });
  }

  const tracking = process.env.VERIFY_TRACKING_NUMBER;
  if (!tracking) {
    record('api: GET /api/public/track/<number>', false, 'VERIFY_TRACKING_NUMBER not set');
  } else {
    await attempt('api: GET /api/public/track/<number>', async () => {
      const r = await get(`${base}/api/public/track/${encodeURIComponent(tracking)}`);
      return { ok: r.status === 200, detail: `status ${r.status}` };
    });
  }

  await attempt('api: GET /api/public/estimate', async () => {
    const gov = await get(`${base}/api/public/governorates`);
    const list = (gov.body as { data?: { code: string }[] } | null)?.data ?? [];
    const [from, to] = [list[0]?.code, list[1]?.code];
    if (!from || !to)
      return { ok: false, detail: `governorates status ${gov.status}, need 2 priced governorates` };
    const r = await get(
      `${base}/api/public/estimate?from=${from}&to=${to}&weightKg=10&goodsType=normal`,
    );
    const price = (r.body as { data?: { price?: number } } | null)?.data?.price;
    if (r.status === 404)
      return {
        ok: true,
        detail: `${from}->${to} has no price (404 is the expected Arabic answer)`,
      };
    return {
      ok: r.status === 200 && typeof price === 'number',
      detail: `${from}->${to} status ${r.status}`,
    };
  });
}

async function main(): Promise<void> {
  await databaseChecks();
  await apiChecks();
  console.log(`\n${formatReport(results)}`);
  if (results.some((r) => !r.ok)) process.exitCode = 1;
}

void main();
