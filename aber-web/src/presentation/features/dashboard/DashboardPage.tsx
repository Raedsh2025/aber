import { Banknote, CheckCircle2, PackagePlus, Package, Truck } from 'lucide-react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { ROLE_LABEL, type User } from '@/domain/entities/User';
import { computeShipmentStats } from '@/domain/services/shipmentStats';
import { Card } from '@/presentation/components/ui/Card';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Spinner } from '@/presentation/components/ui/Spinner';
import { StatCard } from '@/presentation/components/ui/StatCard';
import { StatusChart } from '@/presentation/components/ui/StatusChart';
import { useAuthStore } from '@/presentation/stores/authStore';
import { useShipments } from '../shipments/hooks/useShipments';

const numberFormatter = new Intl.NumberFormat('en-US');

function Hero({ user, showNewShipment }: { user: User; showNewShipment: boolean }): JSX.Element {
  return (
    <section className="bg-brand animate-rise relative overflow-hidden rounded-xl p-6 text-white shadow-lift sm:p-8">
      <span
        aria-hidden="true"
        className="animate-float absolute -top-16 -end-12 h-52 w-52 rounded-full border-[22px] border-gold-500/25"
      />
      <p className="text-gold-100/80">{ROLE_LABEL[user.role]}</p>
      <h2 className="mt-1 text-[26px] font-extrabold">مرحبًا {user.fullName}</h2>
      <p className="mt-2 max-w-lg text-white/80">
        نظرة سريعة على نشاط الشحنات. كل ما تحتاجه لإدارة عملك اليومي في مكان واحد.
      </p>
      {showNewShipment && (
        <Link
          to="/branch/shipments/new"
          className="relative mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-gold-500 px-5 font-bold text-navy-900 transition hover:brightness-110 active:scale-[0.98]"
        >
          <PackagePlus size={18} aria-hidden="true" />
          شحنة جديدة
        </Link>
      )}
    </section>
  );
}

function ShipmentOverview(): JSX.Element {
  const { shipments, loading, error, refresh } = useShipments();
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={() => void refresh()} />;
  const stats = computeShipmentStats(shipments);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي الشحنات"
          value={numberFormatter.format(stats.total)}
          icon={<Package />}
        />
        <StatCard
          label="في الطريق"
          value={numberFormatter.format(stats.inTransit)}
          icon={<Truck />}
          accent="warning"
        />
        <StatCard
          label="سُلّمت"
          value={numberFormatter.format(stats.delivered)}
          icon={<CheckCircle2 />}
          accent="success"
        />
        <StatCard
          label="تحصيل معلّق (ل.س)"
          value={numberFormatter.format(stats.pendingCod)}
          icon={<Banknote />}
          accent="gold"
        />
      </div>
      <Card>
        <h3 className="mb-4 text-[17px] font-bold text-navy-900">توزيع الشحنات حسب الحالة</h3>
        <StatusChart counts={stats.byStatus} />
      </Card>
    </>
  );
}

export function DashboardPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  if (!user) return <></>;
  const hasShipments = user.role === 'branch_staff' || user.role === 'company_admin';

  return (
    <div className="flex flex-col gap-6">
      <Hero user={user} showNewShipment={hasShipments} />
      {hasShipments ? (
        <ShipmentOverview />
      ) : (
        <Card variant="highlight">
          <p className="text-muted">شاشات هذا الدور تُضاف في المراحل القادمة.</p>
        </Card>
      )}
    </div>
  );
}
