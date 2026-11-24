import { ArrowLeft, CalendarClock, Package, Weight } from 'lucide-react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import type { Branch } from '@/domain/entities/Branch';
import type { Trip } from '@/domain/entities/Trip';
import { Card } from '@/presentation/components/ui/Card';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Spinner } from '@/presentation/components/ui/Spinner';
import { TripStatusBadge } from '@/presentation/components/ui/TripStatusBadge';
import { useBranches } from '../shipments/hooks/useBranches';
import { useTrips } from './hooks/useTrips';
import { branchName, dateTimeFormatter } from './tripFormat';

function TripCard({ trip, branches }: { trip: Trip; branches: Branch[] }): JSX.Element {
  const usedPercent =
    trip.capacityKg > 0 ? Math.min(100, (trip.loadedKg / trip.capacityKg) * 100) : 0;
  return (
    <Link
      to={`/driver/trips/${trip.id}`}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-gold-500"
    >
      <Card interactive className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[17px] font-bold text-navy-900">
            {branchName(branches, trip.fromBranchId)}
            <ArrowLeft size={18} aria-hidden="true" className="text-gold-500" />
            {branchName(branches, trip.toBranchId)}
          </p>
          <TripStatusBadge status={trip.status} />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-small text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock size={16} aria-hidden="true" />
            <span dir="ltr">{dateTimeFormatter.format(new Date(trip.departureAt))}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Package size={16} aria-hidden="true" />
            <span dir="ltr">{trip.shipmentsCount}</span> شحنة
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Weight size={16} aria-hidden="true" />
            <span dir="ltr">
              {trip.loadedKg} / {trip.capacityKg} kg
            </span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-tint" aria-hidden="true">
          <div
            className="h-full rounded-full bg-gradient-to-l from-gold-500 to-navy-700 transition-all duration-700"
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </Card>
    </Link>
  );
}

export function DriverTripsPage(): JSX.Element {
  const { trips, loading, error, refresh } = useTrips();
  const { branches } = useBranches();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[20px] font-bold text-navy-900">رحلاتي</h2>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : trips.length === 0 ? (
        <Card>
          <EmptyState title="لا توجد رحلات مسندة إليك">ستظهر هنا عند إسناد رحلة لك.</EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} branches={branches} />
          ))}
        </div>
      )}
    </div>
  );
}
