import { calculatePrice } from '../src/modules/shipments/pricing';
import type { GoodsType } from '../src/modules/shipments/shipment.repository';

export type DemoStatus =
  'received' | 'loaded' | 'in_transit' | 'arrived' | 'delivered' | 'returned' | 'issue';
export type BranchKey = 'ALP' | 'DAM' | 'HMS';
export type TripKey = 'transit' | 'scheduled' | 'closed' | 'loading';

export const DEMO_COMPANY = 'شركة عابر التجريبية';
export const DEMO_OTP = '123456';
export const SENDER_PREFIX = 'عميل تجريبي';

export const BRANCHES: { key: BranchKey; name: string; address: string }[] = [
  { key: 'ALP', name: 'فرع حلب', address: 'حلب' },
  { key: 'DAM', name: 'فرع دمشق', address: 'دمشق' },
  { key: 'HMS', name: 'فرع حمص', address: 'حمص' },
];

/** Price table for every ordered pair of the three branches. */
export const ROUTES: {
  from: BranchKey;
  to: BranchKey;
  base: number;
  perKg: number;
  hours: number;
}[] = [
  { from: 'ALP', to: 'DAM', base: 20000, perKg: 500, hours: 6 },
  { from: 'DAM', to: 'ALP', base: 20000, perKg: 500, hours: 6 },
  { from: 'ALP', to: 'HMS', base: 15000, perKg: 400, hours: 3.5 },
  { from: 'HMS', to: 'ALP', base: 15000, perKg: 400, hours: 3.5 },
  { from: 'HMS', to: 'DAM', base: 10000, perKg: 300, hours: 2.5 },
  { from: 'DAM', to: 'HMS', base: 10000, perKg: 300, hours: 2.5 },
];

/** Accounts. The password of all of them comes from DEMO_PASSWORD (never stored in Git). */
export const USERS = [
  {
    key: 'admin',
    name: 'مدير النظام',
    email: 'admin@aber.local',
    role: 'system_admin',
    branch: null,
  },
  {
    key: 'manager',
    name: 'مدير الشركة',
    email: 'manager@aber.local',
    role: 'company_admin',
    branch: null,
  },
  {
    key: 'staffAlp',
    name: 'موظف فرع حلب',
    email: 'staff@aber.local',
    role: 'branch_staff',
    branch: 'ALP',
  },
  {
    key: 'staffDam',
    name: 'موظف فرع دمشق',
    email: 'staff2@aber.local',
    role: 'branch_staff',
    branch: 'DAM',
  },
  {
    key: 'driver',
    name: 'سائق الخط',
    email: 'driver@aber.local',
    role: 'line_driver',
    branch: null,
  },
] as const;

export const VEHICLES = [
  { plate: '123456', capacityKg: 1500 },
  { plate: '654321', capacityKg: 3000 },
];

export const TRIPS: {
  key: TripKey;
  from: BranchKey;
  to: BranchKey;
  vehicle: 0 | 1;
  departHours: number;
  status: 'scheduled' | 'loading' | 'in_transit' | 'arrived' | 'closed';
}[] = [
  { key: 'transit', from: 'ALP', to: 'DAM', vehicle: 0, departHours: -2, status: 'in_transit' },
  { key: 'scheduled', from: 'DAM', to: 'HMS', vehicle: 1, departHours: 24, status: 'scheduled' },
  { key: 'closed', from: 'HMS', to: 'ALP', vehicle: 0, departHours: -48, status: 'closed' },
  { key: 'loading', from: 'ALP', to: 'HMS', vehicle: 1, departHours: 3, status: 'loading' },
];

export interface ShipmentPlan {
  from: BranchKey;
  to: BranchKey;
  goods: GoodsType;
  weightKg: number;
  cod: number;
  status: DemoStatus;
  trip: TripKey | null;
  daysAgo: number;
}

export const SHIPMENTS: ShipmentPlan[] = [
  {
    from: 'ALP',
    to: 'DAM',
    goods: 'normal',
    weightKg: 20,
    cod: 0,
    status: 'in_transit',
    trip: 'transit',
    daysAgo: 0,
  },
  {
    from: 'ALP',
    to: 'DAM',
    goods: 'fragile',
    weightKg: 10,
    cod: 50000,
    status: 'in_transit',
    trip: 'transit',
    daysAgo: 0,
  },
  {
    from: 'ALP',
    to: 'HMS',
    goods: 'normal',
    weightKg: 5,
    cod: 0,
    status: 'received',
    trip: null,
    daysAgo: 0,
  },
  {
    from: 'ALP',
    to: 'HMS',
    goods: 'normal',
    weightKg: 12,
    cod: 0,
    status: 'received',
    trip: null,
    daysAgo: 1,
  },
  {
    from: 'ALP',
    to: 'HMS',
    goods: 'refrigerated',
    weightKg: 30,
    cod: 40000,
    status: 'loaded',
    trip: 'loading',
    daysAgo: 1,
  },
  {
    from: 'DAM',
    to: 'HMS',
    goods: 'refrigerated',
    weightKg: 40,
    cod: 0,
    status: 'loaded',
    trip: 'scheduled',
    daysAgo: 1,
  },
  {
    from: 'HMS',
    to: 'ALP',
    goods: 'normal',
    weightKg: 15,
    cod: 25000,
    status: 'arrived',
    trip: 'closed',
    daysAgo: 3,
  },
  {
    from: 'HMS',
    to: 'ALP',
    goods: 'normal',
    weightKg: 8,
    cod: 30000,
    status: 'delivered',
    trip: 'closed',
    daysAgo: 3,
  },
  {
    from: 'HMS',
    to: 'ALP',
    goods: 'fragile',
    weightKg: 6,
    cod: 20000,
    status: 'delivered',
    trip: 'closed',
    daysAgo: 4,
  },
  {
    from: 'DAM',
    to: 'ALP',
    goods: 'normal',
    weightKg: 25,
    cod: 0,
    status: 'delivered',
    trip: null,
    daysAgo: 6,
  },
  {
    from: 'DAM',
    to: 'ALP',
    goods: 'normal',
    weightKg: 3,
    cod: 0,
    status: 'returned',
    trip: null,
    daysAgo: 7,
  },
  {
    from: 'DAM',
    to: 'HMS',
    goods: 'fragile',
    weightKg: 9,
    cod: 15000,
    status: 'issue',
    trip: null,
    daysAgo: 8,
  },
  {
    from: 'ALP',
    to: 'DAM',
    goods: 'normal',
    weightKg: 50,
    cod: 60000,
    status: 'delivered',
    trip: null,
    daysAgo: 10,
  },
  {
    from: 'HMS',
    to: 'DAM',
    goods: 'normal',
    weightKg: 7,
    cod: 0,
    status: 'received',
    trip: null,
    daysAgo: 11,
  },
  {
    from: 'DAM',
    to: 'HMS',
    goods: 'normal',
    weightKg: 18,
    cod: 0,
    status: 'delivered',
    trip: null,
    daysAgo: 13,
  },
];

const PATH: Record<DemoStatus, DemoStatus[]> = {
  received: ['received'],
  loaded: ['received', 'loaded'],
  in_transit: ['received', 'loaded', 'in_transit'],
  arrived: ['received', 'loaded', 'in_transit', 'arrived'],
  delivered: ['received', 'loaded', 'in_transit', 'arrived', 'delivered'],
  returned: ['received', 'returned'],
  issue: ['received', 'issue'],
};

/** Statuses a shipment went through, in order (used for the status log). */
export const historyOf = (status: DemoStatus): DemoStatus[] => PATH[status];

export function priceFor(plan: ShipmentPlan): number {
  const route = ROUTES.find((r) => r.from === plan.from && r.to === plan.to);
  if (!route) throw new Error(`No route price for ${plan.from} -> ${plan.to}`);
  return calculatePrice(
    { base_price: route.base, price_per_kg: route.perKg },
    plan.weightKg,
    plan.goods,
  );
}
