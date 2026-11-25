import { zodResolver } from '@hookform/resolvers/zod';
import { Truck } from 'lucide-react';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { createVehicle } from '@/app/container';
import { createVehicleSchema, type CreateVehicleForm } from '@/application/useCases/createVehicle';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Input } from '@/presentation/components/ui/Input';
import { useSubmit } from '@/presentation/hooks/useSubmit';
import { useVehicleList } from './hooks';
import { ListState } from './ListState';

export function VehiclesPage(): JSX.Element {
  const { items, loading, error, refresh } = useVehicleList();
  const save = useSubmit(createVehicle, 'تمت إضافة المركبة', refresh);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateVehicleForm>({ resolver: zodResolver(createVehicleSchema) });

  const onSubmit = (form: CreateVehicleForm): Promise<void> =>
    save
      .run(form)
      .then(() => reset())
      .catch(() => undefined);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[20px] font-bold text-navy-900">المركبات</h2>
      <Card variant="highlight">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <Input
            label="رقم اللوحة"
            dir="ltr"
            className="text-start"
            error={errors.plateNumber?.message}
            {...register('plateNumber')}
          />
          <Input
            label="السعة (كغ)"
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
            إضافة مركبة
          </Button>
        </form>
      </Card>

      <ListState
        loading={loading}
        error={error}
        isEmpty={items.length === 0}
        emptyTitle="لا توجد مركبات بعد"
        onRetry={refresh}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((v) => (
            <Card key={v.id} interactive className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-900/10 text-navy-900"
              >
                <Truck />
              </span>
              <div>
                <p dir="ltr" className="text-start font-mono font-bold text-navy-900">
                  {v.plateNumber}
                </p>
                <p className="text-small text-muted">
                  السعة: <span dir="ltr">{v.capacityKg} kg</span>
                </p>
              </div>
            </Card>
          ))}
        </div>
      </ListState>
    </div>
  );
}
