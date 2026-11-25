import { describe, expect, it } from 'vitest';
import { formatReport, missingPairs, tablesWithoutRls } from './verifyLogic';

describe('verify-env helpers', () => {
  it('lists the missing ordered pairs', () => {
    const priced = [
      { from: 'ALP', to: 'DAM' },
      { from: 'DAM', to: 'ALP' },
      { from: 'ALP', to: 'HMS' },
    ];
    expect(missingPairs(['ALP', 'DAM', 'HMS', 'ALP'], priced)).toEqual([
      ['DAM', 'HMS'],
      ['HMS', 'ALP'],
      ['HMS', 'DAM'],
    ]);
    expect(missingPairs(['ALP'], [])).toEqual([]);
  });

  it('finds tables without RLS', () => {
    expect(
      tablesWithoutRls([
        { table: 'users', rls: true },
        { table: 'trips', rls: false },
      ]),
    ).toEqual(['trips']);
  });

  it('prints PASS and FAIL lines and a summary', () => {
    const out = formatReport([
      { name: 'a', ok: true, detail: '' },
      { name: 'b', ok: false, detail: 'why' },
    ]);
    expect(out).toContain('PASS  a');
    expect(out).toContain('FAIL  b: why');
    expect(out).toContain('1 OF 2 CHECKS FAILED');
  });
});
