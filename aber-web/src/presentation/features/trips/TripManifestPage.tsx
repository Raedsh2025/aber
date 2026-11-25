import { CheckCircle2, Circle, ScanLine, TriangleAlert } from 'lucide-react';
import type { JSX } from 'react';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Trip } from '@/domain/entities/Trip';
import { nextDriverStatus, scanTypeFor, TRIP_ACTION_LABEL } from '@/domain/services/tripStatus';
import { QrScanner } from '@/presentation/components/shared/QrScanner';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Input } from '@/presentation/components/ui/Input';
import { Spinner } from '@/presentation/components/ui/Spinner';
import { StatusBadge } from '@/presentation/components/ui/StatusBadge';
import { TripStatusBadge } from '@/presentation/components/ui/TripStatusBadge';
import { useBranches } from '../shipments/hooks/useBranches';
import { useManifest } from './hooks/useManifest';
import { useAdvanceTrip, useScan } from './hooks/useTripActions';
import { branchName, dateTimeFormatter } from './tripFormat';

const SCAN_TITLE = { load: 'مسح التحميل', arrive: 'مسح الوصول' } as const;

function ScanPanel({ trip, onDone }: { trip: Trip; onDone: () => void }): JSX.Element | null {
  const [code, setCode] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const scan = useScan(trip, onDone);
  const type = scanTypeFor(trip.status);
  if (!type) return null;

  const submit = (text: string): void => {
    scan.run(text).catch(() => undefined);
  };
  const onManual = (event: FormEvent): void => {
    event.preventDefault();
    submit(code);
    setCode('');
  };

  return (
    <Card variant="highlight" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[17px] font-bold text-navy-900">
          <ScanLine size={20} aria-hidden="true" className="text-gold-500" />
          {SCAN_TITLE[type]}
        </h3>
        <Button variant="secondary" size="sm" onClick={() => setShowCamera((v) => !v)}>
          {showCamera ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
        </Button>
      </div>
      {showCamera && <QrScanner onScan={submit} />}
      <form onSubmit={onManual} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="أو أدخل رقم البوليصة يدويًا"
            dir="ltr"
            className="text-start"
            placeholder="AB26..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <Button type="submit" loading={scan.loading}>
          تسجيل
        </Button>
      </form>
      {scan.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-danger">
          {scan.error}
        </p>
      )}
    </Card>
  );
}

export function TripManifestPage(): JSX.Element {
  const { tripId = '' } = useParams();
  const { manifest, loading, error, reload } = useManifest(tripId);
  const { branches } = useBranches();
  const advance = useAdvanceTrip(reload);

  if (loading) return <Spinner />;
  if (error || !manifest)
    return <ErrorState message={error ?? 'الرحلة غير موجودة'} onRetry={reload} />;

  const { trip, shipments, summary } = manifest;
  const next = nextDriverStatus(trip.status);
  const scanType = scanTypeFor(trip.status);
  const done = scanType === 'arrive' ? summary.arrived : summary.loaded;
  const percent = summary.assigned > 0 ? (done / summary.assigned) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <Link to="/driver/trips" className="text-navy-700 underline-offset-4 hover:underline">
        العودة إلى رحلاتي
      </Link>

      <Card variant="highlight" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[20px] font-bold text-navy-900">
            {branchName(branches, trip.fromBranchId)} ← {branchName(branches, trip.toBranchId)}
          </h2>
          <TripStatusBadge status={trip.status} />
        </div>
        <p dir="ltr" className="text-start text-small text-muted">
          {dateTimeFormatter.format(new Date(trip.departureAt))}
        </p>
        <div>
          <div className="mb-1 flex justify-between text-small text-muted">
            <span>{scanType === 'arrive' ? 'تم مسح الوصول' : 'تم التحميل'}</span>
            <span dir="ltr">
              {done} / {summary.assigned}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-tint">
            <div
              className="h-full rounded-full bg-gradient-to-l from-gold-500 to-navy-700 transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        {next && (
          <Button
            size="lg"
            loading={advance.loading}
            onClick={() => advance.run(trip).catch(() => undefined)}
          >
            {TRIP_ACTION_LABEL[trip.status]}
          </Button>
        )}
        {advance.error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-danger">
            {advance.error}
          </p>
        )}
      </Card>

      <ScanPanel trip={trip} onDone={reload} />

      {scanType === 'arrive' && summary.missing.length > 0 && (
        <Card className="flex gap-3 border-warning/40 bg-gold-100">
          <TriangleAlert aria-hidden="true" className="shrink-0 text-warning" />
          <div>
            <p className="font-bold text-warning">
              شحنات لم تُمسح عند الوصول ({summary.missing.length})
            </p>
            <p dir="ltr" className="text-start text-small">
              {summary.missing.join(' ، ')}
            </p>
          </div>
        </Card>
      )}

      <Card flush>
        <h3 className="border-b border-line p-4 text-[17px] font-bold text-navy-900">
          بيان الشحنات
        </h3>
        {shipments.length === 0 ? (
          <EmptyState title="لا توجد شحنات مسندة لهذه الرحلة" />
        ) : (
          <ul>
            {shipments.map((row) => (
              <li
                key={row.id}
                className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-2 last:border-b-0"
              >
                <span className="flex items-center gap-3">
                  {row.loaded ? (
                    <CheckCircle2 aria-label="تم التحميل" className="text-success" size={20} />
                  ) : (
                    <Circle aria-label="لم يُحمّل" className="text-muted" size={20} />
                  )}
                  <span dir="ltr" className="font-mono font-bold text-navy-900">
                    {row.trackingNumber}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span dir="ltr" className="text-small text-muted">
                    {row.weightKg} kg
                  </span>
                  <StatusBadge status={row.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
