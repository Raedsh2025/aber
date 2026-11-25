export interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

/** Ordered governorate pairs that have a branch on both ends but no route price. */
export function missingPairs(
  governorates: string[],
  priced: { from: string; to: string }[],
): [string, string][] {
  const have = new Set(priced.map((p) => `${p.from}>${p.to}`));
  const unique = [...new Set(governorates)].sort();
  const missing: [string, string][] = [];
  for (const a of unique) {
    for (const b of unique) {
      if (a !== b && !have.has(`${a}>${b}`)) missing.push([a, b]);
    }
  }
  return missing;
}

/** Tables with row level security off. */
export const tablesWithoutRls = (rows: { table: string; rls: boolean }[]): string[] =>
  rows.filter((r) => !r.rls).map((r) => r.table);

export function formatReport(results: CheckResult[]): string {
  const lines = results.map(
    (r) => `${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `: ${r.detail}` : ''}`,
  );
  const failed = results.filter((r) => !r.ok).length;
  lines.push(
    '',
    failed === 0
      ? `ALL ${results.length} CHECKS PASSED`
      : `${failed} OF ${results.length} CHECKS FAILED`,
  );
  return lines.join('\n');
}
