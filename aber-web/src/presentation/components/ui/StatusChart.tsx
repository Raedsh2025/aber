import type { JSX } from 'react';
import { SHIPMENT_STATUS_LABEL, type ShipmentStatus } from '@/domain/entities/Shipment';

interface StatusChartProps {
  counts: Record<ShipmentStatus, number>;
}

// Same colors as the status badges (blueprint 3.1), drawn as plain SVG: no chart library.
const BAR_COLOR: Record<ShipmentStatus, string> = {
  received: 'bg-info',
  loaded: 'bg-navy-700',
  in_transit: 'bg-warning',
  arrived: 'bg-gold-500',
  delivered: 'bg-success',
  returned: 'bg-muted',
  issue: 'bg-danger',
};
const STROKE_COLOR: Record<ShipmentStatus, string> = {
  received: 'stroke-info',
  loaded: 'stroke-navy-700',
  in_transit: 'stroke-warning',
  arrived: 'stroke-gold-500',
  delivered: 'stroke-success',
  returned: 'stroke-muted',
  issue: 'stroke-danger',
};
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function StatusChart({ counts }: StatusChartProps): JSX.Element {
  const statuses = Object.keys(SHIPMENT_STATUS_LABEL) as ShipmentStatus[];
  const total = statuses.reduce((sum, s) => sum + counts[s], 0);
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg
        viewBox="0 0 140 140"
        role="img"
        aria-label="توزيع الشحنات حسب الحالة"
        className="h-40 w-40"
      >
        <circle cx="70" cy="70" r={RADIUS} fill="none" strokeWidth="16" className="stroke-tint" />
        {total > 0 &&
          statuses.map((s) => {
            const length = (counts[s] / total) * CIRCUMFERENCE;
            const dash = `${length} ${CIRCUMFERENCE - length}`;
            const circle = (
              <circle
                key={s}
                cx="70"
                cy="70"
                r={RADIUS}
                fill="none"
                strokeWidth="16"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
                className={STROKE_COLOR[s]}
              />
            );
            offset += length;
            return circle;
          })}
        <text
          x="70"
          y="68"
          textAnchor="middle"
          className="fill-navy-900 text-[26px] font-extrabold"
        >
          {total}
        </text>
        <text x="70" y="88" textAnchor="middle" className="fill-muted text-[11px]">
          شحنة
        </text>
      </svg>
      <ul className="grid min-w-48 flex-1 gap-2">
        {statuses.map((s) => (
          <li key={s} className="flex items-center gap-3 text-sm">
            <span className="w-20 shrink-0 text-muted">{SHIPMENT_STATUS_LABEL[s]}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-tint">
              <span
                className={`block h-full rounded-full ${BAR_COLOR[s]} transition-all duration-700`}
                style={{ width: `${total ? (counts[s] / total) * 100 : 0}%` }}
              />
            </span>
            <span dir="ltr" className="w-6 text-end font-bold text-navy-900">
              {counts[s]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
