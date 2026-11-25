import { describe, expect, it } from 'vitest';
import { BRANCHES, ROUTES, SHIPMENTS, TRIPS, USERS, historyOf, priceFor } from './demoPlan';

describe('demo plan', () => {
  it('has a price for every ordered pair of branches', () => {
    for (const a of BRANCHES) {
      for (const b of BRANCHES) {
        if (a.key !== b.key) {
          expect(ROUTES.some((r) => r.from === a.key && r.to === b.key)).toBe(true);
        }
      }
    }
  });

  it('has one account per role, two branch staff and unique emails', () => {
    const roles = USERS.map((u) => u.role);
    expect(new Set(roles)).toEqual(
      new Set(['system_admin', 'company_admin', 'branch_staff', 'line_driver']),
    );
    expect(roles.filter((r) => r === 'branch_staff')).toHaveLength(2);
    expect(new Set(USERS.map((u) => u.email)).size).toBe(USERS.length);
  });

  it('has about 15 shipments covering every status, on real routes', () => {
    expect(SHIPMENTS).toHaveLength(15);
    expect(new Set(SHIPMENTS.map((s) => s.status)).size).toBe(7);
    for (const s of SHIPMENTS) {
      expect(s.from).not.toBe(s.to);
      expect(priceFor(s)).toBeGreaterThan(0);
      expect(historyOf(s.status).at(-1)).toBe(s.status);
    }
  });

  it('only uses trips that exist and keeps a trip within one lane', () => {
    const keys = new Set(TRIPS.map((t) => t.key));
    for (const s of SHIPMENTS.filter((x) => x.trip)) {
      const trip = TRIPS.find((t) => t.key === s.trip);
      expect(keys.has(s.trip!)).toBe(true);
      expect(trip?.from).toBe(s.from);
      expect(trip?.to).toBe(s.to);
    }
  });

  it('prices follow the shared formula (fragile x1.25)', () => {
    expect(priceFor({ ...SHIPMENTS[1]! })).toBe(Math.round((20000 + 500 * 10) * 1.25));
  });
});
