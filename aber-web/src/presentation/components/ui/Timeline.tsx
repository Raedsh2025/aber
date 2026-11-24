import type { JSX } from 'react';
import { SHIPMENT_STATUS_LABEL, type StatusHistoryItem } from '@/domain/entities/Shipment';

const formatter = new Intl.DateTimeFormat('ar-SY-u-nu-latn', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function Timeline({ items }: { items: StatusHistoryItem[] }): JSX.Element {
  return (
    <ol className="border-s-2 border-line ps-4">
      {items.map((item, index) => (
        <li key={`${item.status}-${item.changedAt}-${index}`} className="relative pb-4">
          <span className="absolute -start-[25px] top-1.5 h-3 w-3 rounded-full bg-navy-900" />
          <p className="font-semibold text-navy-900">{SHIPMENT_STATUS_LABEL[item.status]}</p>
          <p dir="ltr" className="text-small text-muted text-start">
            {formatter.format(new Date(item.changedAt))}
          </p>
          {item.note && <p className="text-small">{item.note}</p>}
        </li>
      ))}
    </ol>
  );
}
