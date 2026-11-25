import { describe, expect, it } from 'vitest';
import { canTransition, type ShipmentStatus } from './shipmentStatus';
import { canTripTransition, type TripStatus } from './tripStatus';

const SHIPMENT: ShipmentStatus[] = [
  'received',
  'loaded',
  'in_transit',
  'arrived',
  'delivered',
  'returned',
  'issue',
];
const TRIP: TripStatus[] = ['scheduled', 'loading', 'in_transit', 'arrived', 'closed'];

// The full list of allowed pairs, written out so any change to the rules fails a test.
const SHIPMENT_ALLOWED = new Set([
  'received>loaded',
  'received>returned',
  'received>issue',
  'loaded>in_transit',
  'loaded>issue',
  'in_transit>arrived',
  'in_transit>issue',
  'arrived>delivered',
  'arrived>returned',
  'arrived>issue',
  'issue>received',
  'issue>loaded',
  'issue>in_transit',
  'issue>arrived',
  'issue>returned',
]);
const TRIP_ALLOWED = new Set([
  'scheduled>loading',
  'loading>in_transit',
  'in_transit>arrived',
  'arrived>closed',
]);

describe('shipment transition matrix', () => {
  for (const from of SHIPMENT) {
    for (const to of SHIPMENT) {
      const expected = SHIPMENT_ALLOWED.has(`${from}>${to}`);
      it(`${from} -> ${to} is ${expected ? 'allowed' : 'blocked'}`, () => {
        expect(canTransition(from, to)).toBe(expected);
      });
    }
  }
});

describe('trip transition matrix', () => {
  for (const from of TRIP) {
    for (const to of TRIP) {
      const expected = TRIP_ALLOWED.has(`${from}>${to}`);
      it(`${from} -> ${to} is ${expected ? 'allowed' : 'blocked'}`, () => {
        expect(canTripTransition(from, to)).toBe(expected);
      });
    }
  }
});
