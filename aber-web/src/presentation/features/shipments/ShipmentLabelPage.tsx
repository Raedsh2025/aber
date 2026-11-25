import { Printer } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { shipmentRepository } from '@/app/container';
import { GOODS_TYPE_LABEL, type Shipment } from '@/domain/entities/Shipment';
import { QrLabel } from '@/presentation/components/shared/QrLabel';
import { Button } from '@/presentation/components/ui/Button';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Spinner } from '@/presentation/components/ui/Spinner';

/** A print-friendly shipping label. The layout header and nav are hidden when printing. */
export function ShipmentLabelPage(): JSX.Element {
  const { trackingNumber = '' } = useParams();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    shipmentRepository
      .getByTrackingNumber(trackingNumber)
      .then((s) => {
        if (!cancelled) setShipment(s);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'تعذّر تحميل الشحنة');
      });
    return () => {
      cancelled = true;
    };
  }, [trackingNumber]);

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!shipment) return <Spinner />;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="no-print flex items-center justify-between gap-3">
        <Link
          to={`/branch/shipments/${shipment.trackingNumber}`}
          className="inline-flex min-h-11 items-center text-navy-900 underline"
        >
          رجوع للشحنة
        </Link>
        <Button onClick={() => window.print()}>
          <Printer aria-hidden="true" className="me-2 h-4 w-4" />
          طباعة
        </Button>
      </div>
      <section
        aria-label="ملصق الشحنة"
        className="flex flex-col items-center gap-4 rounded-xl border-2 border-navy-900 bg-white p-6 text-center"
      >
        <QrLabel trackingNumber={shipment.trackingNumber} />
        <dl className="grid w-full grid-cols-2 gap-2 text-start">
          <dt className="text-muted">المستلم</dt>
          <dd className="font-bold">{shipment.receiverName}</dd>
          <dt className="text-muted">هاتف المستلم</dt>
          <dd dir="ltr" className="text-start font-bold">
            {shipment.receiverPhone}
          </dd>
          <dt className="text-muted">نوع البضاعة</dt>
          <dd className="font-bold">{GOODS_TYPE_LABEL[shipment.goodsType]}</dd>
          <dt className="text-muted">الوزن</dt>
          <dd dir="ltr" className="text-start font-bold">
            {shipment.weightKg} kg
          </dd>
          {shipment.codAmount > 0 && (
            <>
              <dt className="text-muted">الدفع عند الاستلام</dt>
              <dd dir="ltr" className="text-start font-bold">
                {shipment.codAmount}
              </dd>
            </>
          )}
        </dl>
      </section>
    </div>
  );
}
