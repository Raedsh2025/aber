import type { ScanType, TripStatus } from '../entities/Trip';

const NEXT: Record<TripStatus, TripStatus | null> = {
  scheduled: 'loading',
  loading: 'in_transit',
  in_transit: 'arrived',
  arrived: 'closed',
  closed: null,
};

// Arabic action label for moving a trip to its next status.
export const TRIP_ACTION_LABEL: Record<TripStatus, string> = {
  scheduled: 'بدء التحميل',
  loading: 'انطلاق الرحلة',
  in_transit: 'تأكيد الوصول',
  arrived: 'إغلاق الرحلة',
  closed: '',
};

export const nextTripStatus = (from: TripStatus): TripStatus | null => NEXT[from];

// A driver can never close a trip (the API enforces it too).
export const nextDriverStatus = (from: TripStatus): TripStatus | null => {
  const next = NEXT[from];
  return next === 'closed' ? null : next;
};

/** Which scan a trip accepts right now, or null when scanning is not possible. */
export const scanTypeFor = (status: TripStatus): ScanType | null => {
  if (status === 'scheduled' || status === 'loading') return 'load';
  if (status === 'in_transit' || status === 'arrived') return 'arrive';
  return null;
};
