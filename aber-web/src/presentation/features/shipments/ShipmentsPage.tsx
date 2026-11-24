import type { JSX } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GOODS_TYPE_LABEL,
  SHIPMENT_STATUS_LABEL,
  type ShipmentStatus,
} from '@/domain/entities/Shipment';
import { Card } from '@/presentation/components/ui/Card';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Input } from '@/presentation/components/ui/Input';
import { Select } from '@/presentation/components/ui/Select';
import { Spinner } from '@/presentation/components/ui/Spinner';
import { StatusBadge } from '@/presentation/components/ui/StatusBadge';
import { useDebounce } from '@/presentation/hooks/useDebounce';
import { useShipments } from './hooks/useShipments';

const STATUSES = Object.keys(SHIPMENT_STATUS_LABEL) as ShipmentStatus[];
const priceFormatter = new Intl.NumberFormat('en-US');

export function ShipmentsPage(): JSX.Element {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ShipmentStatus | ''>('');
  const debouncedSearch = useDebounce(search);

  const { shipments, loading, error, refresh } = useShipments({
    search: debouncedSearch || undefined,
    status: status || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-navy-900 text-[20px] font-bold">الشحنات</h2>
        <Link
          to="/branch/shipments/new"
          className="inline-flex h-11 items-center rounded-md bg-gradient-to-b from-navy-700 to-navy-900 px-5 font-semibold text-white shadow-card transition hover:shadow-lift active:scale-[0.98]"
        >
          شحنة جديدة
        </Link>
      </div>

      <Card className="grid gap-4 sm:grid-cols-2">
        <Input
          label="بحث (رقم البوليصة أو اسم المستلم)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="الحالة"
          value={status}
          onChange={(e) => setStatus(e.target.value as ShipmentStatus | '')}
        >
          <option value="">الكل</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {SHIPMENT_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </Card>

      <Card className="overflow-hidden p-0 sm:p-0">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refresh()} />
        ) : shipments.length === 0 ? (
          <EmptyState title="لا توجد شحنات">جرّب تغيير البحث أو أنشئ شحنة جديدة.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-brand text-white">
                <tr>
                  <th className="p-3 text-start">رقم البوليصة</th>
                  <th className="p-3 text-start">المستلم</th>
                  <th className="p-3 text-start">النوع</th>
                  <th className="p-3 text-start">الوزن</th>
                  <th className="p-3 text-start">السعر</th>
                  <th className="p-3 text-start">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-line/70 transition hover:bg-gold-100/60"
                  >
                    <td className="p-3">
                      <Link
                        to={`/branch/shipments/${encodeURIComponent(s.trackingNumber)}`}
                        dir="ltr"
                        className="inline-block min-h-11 py-2 font-mono font-bold text-navy-700 underline"
                      >
                        {s.trackingNumber}
                      </Link>
                    </td>
                    <td className="p-3">{s.receiverName}</td>
                    <td className="p-3">{GOODS_TYPE_LABEL[s.goodsType]}</td>
                    <td className="p-3">
                      <span dir="ltr">{s.weightKg} kg</span>
                    </td>
                    <td className="p-3">
                      <span dir="ltr">{priceFormatter.format(s.price)}</span>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
