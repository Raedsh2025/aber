import { Banknote, Boxes, HandCoins, Scale } from 'lucide-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { reportRepository } from '@/app/container';
import type { BranchDailyReport } from '@/domain/entities/BranchDailyReport';
import { SHIPMENT_STATUS_LABEL, type ShipmentStatus } from '@/domain/entities/Shipment';
import { Card } from '@/presentation/components/ui/Card';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Input } from '@/presentation/components/ui/Input';
import { Select } from '@/presentation/components/ui/Select';
import { Spinner } from '@/presentation/components/ui/Spinner';
import { StatCard } from '@/presentation/components/ui/StatCard';
import { useBranchList } from '@/presentation/features/admin/hooks';
import { useAuthStore } from '@/presentation/stores/authStore';

type Loaded = { report: BranchDailyReport } | { error: string } | null;

const number = new Intl.NumberFormat('en-US');

export function BranchDailyReportPage(): JSX.Element {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === 'company_admin';
  const branches = useBranchList();
  const [date, setDate] = useState('');
  const [branchId, setBranchId] = useState('');
  const [result, setResult] = useState<Loaded>(null);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => setVersion((v) => v + 1), []);

  const needsBranch = isAdmin && !branchId;

  useEffect(() => {
    if (needsBranch) return;
    let cancelled = false;
    reportRepository
      .branchDaily({ date: date || undefined, branchId: branchId || undefined })
      .then((report) => {
        if (!cancelled) setResult({ report });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setResult({ error: e instanceof Error ? e.message : 'تعذّر تحميل التقرير' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [date, branchId, needsBranch, version]);

  const changeDate = (value: string): void => {
    setResult(null);
    setDate(value);
  };
  const changeBranch = (value: string): void => {
    setResult(null);
    setBranchId(value);
  };

  const report = result && 'report' in result ? result.report : null;
  const statuses = report ? (Object.entries(report.byStatus) as [ShipmentStatus, number][]) : [];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[20px] font-bold text-navy-900">تقرير الفرع اليومي</h2>
      <Card variant="highlight">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="التاريخ (الافتراضي اليوم)"
            type="date"
            dir="ltr"
            className="text-start"
            value={date}
            onChange={(e) => changeDate(e.target.value)}
          />
          {isAdmin && (
            <Select label="الفرع" value={branchId} onChange={(e) => changeBranch(e.target.value)}>
              <option value="">اختر...</option>
              {branches.items.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </Card>

      {needsBranch && (
        <Card>
          <EmptyState title="اختر فرعًا لعرض تقريره" />
        </Card>
      )}
      {!needsBranch && result === null && <Spinner />}
      {result && 'error' in result && <ErrorState message={result.error} onRetry={retry} />}
      {report && (
        <>
          <p className="text-muted">
            {report.branchName} · <span dir="ltr">{report.date}</span>
          </p>
          {report.shipmentsCount === 0 ? (
            <Card>
              <EmptyState title="لا توجد شحنات في هذا اليوم" />
            </Card>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="عدد الشحنات"
                  value={number.format(report.shipmentsCount)}
                  icon={<Boxes />}
                />
                <StatCard
                  label="الوزن (كغ)"
                  value={number.format(report.totalWeightKg)}
                  icon={<Scale />}
                  accent="gold"
                />
                <StatCard
                  label="الأجور"
                  value={number.format(report.totalPrice)}
                  icon={<Banknote />}
                  accent="success"
                />
                <StatCard
                  label="الدفع عند الاستلام"
                  value={number.format(report.totalCod)}
                  icon={<HandCoins />}
                  accent="warning"
                />
              </div>
              <Card>
                <h3 className="mb-2 font-bold text-navy-900">حسب الحالة</h3>
                <ul className="flex flex-col gap-1">
                  {statuses.map(([status, count]) => (
                    <li key={status} className="flex justify-between">
                      <span>{SHIPMENT_STATUS_LABEL[status]}</span>
                      <span dir="ltr">{count}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
