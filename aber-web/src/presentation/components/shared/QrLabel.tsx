import { QRCodeSVG } from 'qrcode.react';
import type { JSX } from 'react';

export function QrLabel({ trackingNumber }: { trackingNumber: string }): JSX.Element {
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-lg border border-line p-4">
      <QRCodeSVG value={trackingNumber} size={140} level="M" />
      <span dir="ltr" className="font-mono text-sm font-bold text-navy-900">
        {trackingNumber}
      </span>
    </div>
  );
}
