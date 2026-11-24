import clsx from 'clsx';
import type { JSX } from 'react';
import { SHIPMENT_STATUS_LABEL, type ShipmentStatus } from '@/domain/entities/Shipment';

const tone: Record<ShipmentStatus, string> = {
  received: 'bg-info/10 text-info',
  loaded: 'bg-navy-700/10 text-navy-700',
  in_transit: 'bg-warning/10 text-warning',
  arrived: 'bg-gold-500/15 text-gold-500',
  delivered: 'bg-success/10 text-success',
  returned: 'bg-muted/10 text-muted',
  issue: 'bg-danger/10 text-danger',
};

export function StatusBadge({ status }: { status: ShipmentStatus }): JSX.Element {
  return (
    <span
      className={clsx('inline-block rounded-full px-3 py-0.5 text-sm font-semibold', tone[status])}
    >
      {SHIPMENT_STATUS_LABEL[status]}
    </span>
  );
}
