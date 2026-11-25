import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/presentation/components/ui/Card';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Spinner } from '@/presentation/components/ui/Spinner';
import { StatusBadge } from '@/presentation/components/ui/StatusBadge';
import { useAuthStore } from '@/presentation/stores/authStore';
import { useMyShipments } from './hooks/useMyShipments';

export function AccountPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const { shipments, loading, error } = useMyShipments();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="text-[20px] font-bold text-navy-900">حسابي</h2>
        {user && (
          <dl className="mt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">الاسم</dt>
              <dd className="font-semibold text-navy-900">{user.fullName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">البريد الإلكتروني</dt>
              <dd className="font-semibold text-navy-900" dir="ltr">
                {user.email}
              </dd>
            </div>
            {user.phone && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">رقم الهاتف</dt>
                <dd className="font-semibold text-navy-900" dir="ltr">
                  {user.phone}
                </dd>
              </div>
            )}
          </dl>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-md bg-navy-900 px-4 font-semibold text-white transition hover:brightness-110"
          >
            تتبّع شحنة
          </Link>
          <Link
            to="/estimate"
            className="inline-flex h-11 items-center rounded-md border border-line bg-surface px-4 font-semibold text-navy-900 transition hover:bg-navy-900/5"
          >
            تقدير سعر
          </Link>
        </div>
      </Card>

      <Card flush>
        <div className="border-b border-line p-4">
          <h3 className="font-bold text-navy-900">شحناتي</h3>
          <p className="mt-1 text-small text-muted">
            الشحنات المسجلة على رقم هاتفك كمرسل أو مستلم.
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorState message={error} />
        ) : shipments.length === 0 ? (
          <EmptyState title="لا توجد شحنات على رقمك بعد">
            عندما يسجّل أحد الفروع شحنة برقم هاتفك ستظهر هنا.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {shipments.map((shipment) => (
              <li key={shipment.trackingNumber} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-navy-900" dir="ltr">
                    {shipment.trackingNumber}
                  </p>
                  <p className="text-small text-muted">
                    {shipment.originGovernorate} ← {shipment.destGovernorate}
                  </p>
                </div>
                <StatusBadge status={shipment.status} />
                <Link
                  to={`/?track=${shipment.trackingNumber}`}
                  className="inline-flex h-11 items-center rounded-md border border-line px-3 text-small font-semibold text-navy-900 transition hover:bg-navy-900/5"
                >
                  تتبّع
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
