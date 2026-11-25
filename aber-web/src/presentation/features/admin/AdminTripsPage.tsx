import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { createTrip } from '@/app/container';
import { createTripSchema, type CreateTripForm } from '@/application/useCases/createTrip';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Input } from '@/presentation/components/ui/Input';
import { Select } from '@/presentation/components/ui/Select';
import { TripStatusBadge } from '@/presentation/components/ui/TripStatusBadge';
import { useSubmit } from '@/presentation/hooks/useSubmit';
import { branchName, dateTimeFormatter } from '../trips/tripFormat';
import { useBranchList, useStaffList, useTripList, useVehicleList } from './hooks';
import { ListState } from './ListState';

export function AdminTripsPage(): JSX.Element {
  const trips = useTripList();
  const branches = useBranchList();
  const vehicles = useVehicleList();
  const staff = useStaffList();
  const save = useSubmit(createTrip, 'تم إنشاء الرحلة', trips.refresh);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTripForm>({ resolver: zodResolver(createTripSchema) });

  const drivers = staff.items.filter((m) => m.role === 'line_driver');
  const onSubmit = (form: CreateTripForm): Promise<void> =>
    save
      .run(form)
      .then(() => reset())
      .catch(() => undefined);

  const branchOptions = branches.items.map((b) => (
    <option key={b.id} value={b.id}>
      {b.name}
    </option>
  ));

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[20px] font-bold text-navy-900">الرحلات</h2>
      <Card variant="highlight">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <Select label="من فرع" error={errors.fromBranchId?.message} {...register('fromBranchId')}>
            <option value="">اختر...</option>
            {branchOptions}
          </Select>
          <Select label="إلى فرع" error={errors.toBranchId?.message} {...register('toBranchId')}>
            <option value="">اختر...</option>
            {branchOptions}
          </Select>
          <Select label="السائق (اختياري)" {...register('driverId')}>
            <option value="">بدون</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </Select>
          <Select label="المركبة" {...register('vehicleId')}>
            <option value="">بدون</option>
            {vehicles.items.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plateNumber} ({v.capacityKg} kg)
              </option>
            ))}
          </Select>
          <Input
            label="موعد الانطلاق"
            type="datetime-local"
            dir="ltr"
            className="text-start"
            error={errors.departureAt?.message}
            {...register('departureAt')}
          />
          <Input
            label="السعة (كغ) إن لم تُحدَّد مركبة"
            type="number"
            dir="ltr"
            className="text-start"
            error={errors.capacityKg?.message}
            {...register('capacityKg')}
          />
          {save.error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-danger sm:col-span-2">
              {save.error}
            </p>
          )}
          <Button type="submit" loading={save.loading} className="sm:col-span-2">
            إنشاء رحلة
          </Button>
        </form>
      </Card>

      <ListState
        loading={trips.loading}
        error={trips.error}
        isEmpty={trips.items.length === 0}
        emptyTitle="لا توجد رحلات بعد"
        onRetry={trips.refresh}
      >
        <Card flush>
          <ul>
            {trips.items.map((t) => (
              <li
                key={t.id}
                className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3 last:border-b-0"
              >
                <span>
                  <p className="flex items-center gap-2 font-bold text-navy-900">
                    {branchName(branches.items, t.fromBranchId)}
                    <ArrowLeft size={16} aria-hidden="true" className="text-gold-500" />
                    {branchName(branches.items, t.toBranchId)}
                  </p>
                  <p className="flex flex-wrap gap-x-3 text-small text-muted">
                    <span dir="ltr">{dateTimeFormatter.format(new Date(t.departureAt))}</span>
                    <span dir="ltr">
                      {t.loadedKg}/{t.capacityKg} kg
                    </span>
                  </p>
                </span>
                <TripStatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        </Card>
      </ListState>
    </div>
  );
}
