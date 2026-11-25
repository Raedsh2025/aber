import clsx from 'clsx';
import type { JSX } from 'react';
import { TRIP_STATUS_LABEL, type TripStatus } from '@/domain/entities/Trip';

const tone: Record<TripStatus, string> = {
  scheduled: 'bg-info/10 text-info',
  loading: 'bg-navy-700/10 text-navy-700',
  in_transit: 'bg-warning/10 text-warning',
  arrived: 'bg-gold-500/15 text-gold-500',
  closed: 'bg-muted/10 text-muted',
};

export function TripStatusBadge({ status }: { status: TripStatus }): JSX.Element {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-semibold',
        tone[status],
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {TRIP_STATUS_LABEL[status]}
    </span>
  );
}
