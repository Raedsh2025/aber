import type { Role } from '../entities/User';

export const STAFF_LANDING_PATH = '/dashboard';
export const CUSTOMER_LANDING_PATH = '/account';

/** Where each role lands after signing in. */
export function landingPathFor(role: Role): string {
  return role === 'customer' ? CUSTOMER_LANDING_PATH : STAFF_LANDING_PATH;
}
