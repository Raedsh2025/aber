import { Banknote, Building2, Boxes, Route, Users } from 'lucide-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { statsRepository } from '@/app/container';
import type { PlatformStats } from '@/domain/entities/PlatformStats';
import { SHIPMENT_STATUS_LABEL, type ShipmentStatus } from '@/domain/entities/Shipment';
import { BarChart } from '@/presentation/components/ui/BarChart';
import { Card } from '@/presentation/components/ui/Card';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Spinner } from '@/presentation/components/ui/Spinner';
import { StatCard } from '@/presentation/components/ui/StatCard';

type Loaded = { stats: PlatformStats } | { error: string } | null;

const number = new Intl.NumberFormat('en-US');

export function SystemStatsPage(): JSX.Element {
  const [result, setResult] = useState<Loaded>(null);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => {
    setResult(null);
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    statsRepository
      .platform()
      .then((stats) => {
        if (!cancelled) setResult({ stats });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setResult({ error: e instanceof Error ? e.message : 'تعذّر تحميل الإحصاءات' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (result === null) return <Spinner />;
  if ('error' in result) return <ErrorState message={result.error} onRetry={retry} />;
  const { stats } = result;
  const companyCount = Object.values(stats.companies).reduce((a, b) => a + b, 0);
  const statuses = Object.entries(stats.shipmentsByStatus) as [ShipmentStatus, number][];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[20px] font-bold text-navy-900">إحصاءات المنصة</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="الشركات" value={number.format(companyCount)} icon={<Building2 />} />
        <StatCard
          label="شركات بانتظار الاعتماد"
          value={number.format(stats.companies.pending ?? 0)}
          icon={<Building2 />}
          accent="warning"
        />
        <StatCard
          label="المستخدمون"
          value={number.format(stats.users)}
          icon={<Users />}
          accent="gold"
        />
        <StatCard label="الرحلات" value={number.format(stats.trips)} icon={<Route />} />
        <StatCard
          label="الشحنات"
          value={number.format(stats.shipmentsTotal)}
          icon={<Boxes />}
          accent="gold"
        />
        <StatCard
          label="إجمالي الأجور"
          value={number.format(stats.totalRevenue)}
          icon={<Banknote />}
          accent="success"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="دفع عند الاستلام: محصّل"
          value={number.format(stats.cod.collected)}
          icon={<Banknote />}
        />
        <StatCard
          label="دفع عند الاستلام: مُسوّى"
          value={number.format(stats.cod.settled)}
          icon={<Banknote />}
          accent="success"
        />
        <StatCard
          label="دفع عند الاستلام: غير مُسوّى"
          value={number.format(stats.cod.pending)}
          icon={<Banknote />}
          accent="warning"
        />
      </div>
      <Card>
        <h3 className="mb-2 font-bold text-navy-900">الشحنات خلال آخر 14 يومًا</h3>
        {stats.shipmentsPerDay.every((d) => d.count === 0) ? (
          <p className="text-muted">لا توجد شحنات في هذه الفترة</p>
        ) : (
          <BarChart
            ariaLabel="عدد الشحنات يوميًا خلال آخر 14 يومًا"
            data={stats.shipmentsPerDay.map((d) => ({ label: d.day.slice(5), value: d.count }))}
          />
        )}
      </Card>
      <Card>
        <h3 className="mb-2 font-bold text-navy-900">الشحنات حسب الحالة</h3>
        {statuses.length === 0 ? (
          <p className="text-muted">لا توجد شحنات بعد</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {statuses.map(([status, count]) => (
              <li key={status} className="flex justify-between">
                <span>{SHIPMENT_STATUS_LABEL[status]}</span>
                <span dir="ltr">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
