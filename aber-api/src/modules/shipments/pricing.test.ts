import { describe, expect, it } from 'vitest';
import { calculatePrice } from './pricing';

const route = { base_price: 10_000, price_per_kg: 500 };

describe('calculatePrice', () => {
  it('uses base price plus weight price for normal goods', () => {
    expect(calculatePrice(route, 20, 'normal')).toBe(20_000);
  });
  it('applies the fragile and refrigerated factors', () => {
    expect(calculatePrice(route, 20, 'fragile')).toBe(25_000);
    expect(calculatePrice(route, 20, 'refrigerated')).toBe(30_000);
  });
  it('rounds to a whole number', () => {
    expect(calculatePrice({ base_price: 100, price_per_kg: 0.333 }, 1, 'normal')).toBe(100);
  });
});
