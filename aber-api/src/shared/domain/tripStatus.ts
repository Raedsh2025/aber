export type TripStatus = 'scheduled' | 'loading' | 'in_transit' | 'arrived' | 'closed';

const ALLOWED: Record<TripStatus, TripStatus[]> = {
  scheduled: ['loading'],
  loading: ['in_transit'],
  in_transit: ['arrived'],
  arrived: ['closed'],
  closed: [],
};

export const canTripTransition = (from: TripStatus, to: TripStatus): boolean =>
  ALLOWED[from].includes(to);
