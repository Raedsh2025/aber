import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shipmentRepository } from '@/app/container';
import { otpSchema } from '@/application/useCases/deliverShipment';
import {
  GOODS_TYPE_LABEL,
  SHIPMENT_STATUS_LABEL,
  type PublicTracking,
  type Shipment,
} from '@/domain/entities/Shipment';
import { nextStatuses } from '@/domain/services/shipmentStatus';
import { QrLabel } from '@/presentation/components/shared/QrLabel';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Input } from '@/presentation/components/ui/Input';
import { Spinner } from '@/presentation/components/ui/Spinner';
import { StatusBadge } from '@/presentation/components/ui/StatusBadge';
import { Timeline } from '@/presentation/components/ui/Timeline';
import { useAdvanceStatus } from './hooks/useAdvanceStatus';
import { useDeliver } from './hooks/useDeliver';

interface Loaded {
  shipment: Shipment;
  tracking: PublicTracking;
}

export function ShipmentDetailPage(): JSX.Element {
  const { trackingNumber = '' } = useParams();
  const [data, setData] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const advance = useAdvanceStatus();
  const deliver = useDeliver();

  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      shipmentRepository.getByTrackingNumber(trackingNumber),
      shipmentRepository.trackPublic(trackingNumber),
    ])
      .then(([shipment, tracking]) => {
        if (cancelled) return;
        setData({ shipment, tracking });
        setLoadError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'تعذّر تحميل الشحنة');
      });
    return () => {
      cancelled = true;
    };
  }, [trackingNumber, version]);

  if (loadError) return <ErrorState message={loadError} onRetry={() => reload()} />;
  if (!data) return <Spinner />;
  const { shipment, tracking } = data;

  // Delivery has its own OTP flow, so "delivered" is not offered as a plain status button.
  const options = nextStatuses(shipment.status).filter((s) => s !== 'delivered');

  const onAdvance = async (next: (typeof options)[number]): Promise<void> => {
    try {
      await advance.run(shipment, next);
      reload();
    } catch {
      // Shown through advance.error.
    }
  };

  const onDeliver = async (): Promise<void> => {
    const parsed = otpSchema.safeParse({ otp });
    if (!parsed.success) {
      setOtpError(parsed.error.issues[0]?.message ?? 'رمز غير صالح');
      return;
    }
    setOtpError(null);
    try {
      await deliver.run(shipment, parsed.data.otp);
      setOtp('');
      reload();
    } catch {
      // Shown through deliver.error.
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/branch/shipments"
        className="inline-flex min-h-11 items-center text-navy-700 underline"
      >
        العودة إلى القائمة
      </Link>

      <Card variant="highlight">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span dir="ltr" className="font-mono text-[20px] font-bold text-navy-900">
            {shipment.trackingNumber}
          </span>
          <StatusBadge status={shipment.status} />
        </div>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-small text-muted">المرسل</dt>
            <dd>
              {shipment.senderName} <span dir="ltr">{shipment.senderPhone}</span>
            </dd>
          </div>
          <div>
            <dt className="text-small text-muted">المستلم</dt>
            <dd>
              {shipment.receiverName} <span dir="ltr">{shipment.receiverPhone}</span>
            </dd>
          </div>
          <div>
            <dt className="text-small text-muted">البضاعة</dt>
            <dd>
              {GOODS_TYPE_LABEL[shipment.goodsType]}، <span dir="ltr">{shipment.weightKg} kg</span>
            </dd>
          </div>
          <div>
            <dt className="text-small text-muted">السعر / الدفع عند الاستلام</dt>
            <dd dir="ltr" className="text-start">
              {shipment.price} / {shipment.codAmount}
            </dd>
          </div>
          <div>
            <dt className="text-small text-muted">المسار</dt>
            <dd>
              {tracking.originGovernorate} ← {tracking.destGovernorate}
            </dd>
          </div>
        </dl>
      </Card>

      {options.length > 0 && (
        <Card>
          <h3 className="mb-3 font-bold text-navy-900">تغيير الحالة</h3>
          <div className="flex flex-wrap gap-3">
            {options.map((next) => (
              <Button
                key={next}
                variant={next === 'issue' ? 'danger' : 'secondary'}
                loading={advance.loading}
                onClick={() => void onAdvance(next)}
              >
                {SHIPMENT_STATUS_LABEL[next]}
              </Button>
            ))}
          </div>
          {advance.error && (
            <p role="alert" className="mt-3 text-danger">
              {advance.error}
            </p>
          )}
        </Card>
      )}

      {shipment.status === 'arrived' && (
        <Card>
          <h3 className="mb-3 font-bold text-navy-900">التسليم برمز التحقق</h3>
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="رمز المستلم (6 أرقام)"
              dir="ltr"
              inputMode="numeric"
              maxLength={6}
              className="text-start"
              value={otp}
              error={otpError ?? undefined}
              onChange={(e) => setOtp(e.target.value)}
            />
            <Button loading={deliver.loading} onClick={() => void onDeliver()}>
              تسليم
            </Button>
          </div>
          {deliver.error && (
            <p role="alert" className="mt-3 text-danger">
              {deliver.error}
            </p>
          )}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-bold text-navy-900">سجل الحالات</h3>
          <Timeline items={tracking.history} />
        </Card>
        <Card className="flex justify-center">
          <QrLabel trackingNumber={shipment.trackingNumber} />
        </Card>
      </div>
    </div>
  );
}
