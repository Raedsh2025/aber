/**
 * Phone numbers are compared as digits only, so a number typed with spaces,
 * dashes or a leading "+" still matches the stored one. Numbers saved in a
 * different country-code format (e.g. with and without "963") do not match.
 */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}
