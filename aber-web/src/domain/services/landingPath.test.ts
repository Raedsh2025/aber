import { describe, expect, it } from 'vitest';
import { landingPathFor } from './landingPath';

describe('landingPathFor', () => {
  it('sends customers to their account page', () => {
    expect(landingPathFor('customer')).toBe('/account');
  });
  it('sends staff roles to the dashboard', () => {
    for (const role of ['system_admin', 'company_admin', 'branch_staff', 'line_driver'] as const) {
      expect(landingPathFor(role)).toBe('/dashboard');
    }
  });
});
