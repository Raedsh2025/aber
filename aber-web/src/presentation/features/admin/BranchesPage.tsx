import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin } from 'lucide-react';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { createBranch } from '@/app/container';
import { createBranchSchema, type CreateBranchForm } from '@/application/useCases/createBranch';
import { GOVERNORATES } from '@/domain/entities/Governorate';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Input } from '@/presentation/components/ui/Input';
import { Select } from '@/presentation/components/ui/Select';
import { useSubmit } from '@/presentation/hooks/useSubmit';
import { useBranchList } from './hooks';
import { ListState } from './ListState';

export function BranchesPage(): JSX.Element {
  const { items, loading, error, refresh } = useBranchList();
  const save = useSubmit(createBranch, 'تمت إضافة الفرع', refresh);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBranchForm>({ resolver: zodResolver(createBranchSchema) });

  const onSubmit = (form: CreateBranchForm): Promise<void> =>
    save
      .run(form)
      .then(() => reset())
      .catch(() => undefined);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[20px] font-bold text-navy-900">الفروع</h2>
      <Card variant="highlight">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <Select
            label="المحافظة"
            error={errors.governorateCode?.message}
            {...register('governorateCode')}
          >
            <option value="">اختر...</option>
            {GOVERNORATES.map((g) => (
              <option key={g.code} value={g.code}>
                {g.name}
              </option>
            ))}
          </Select>
          <Input label="اسم الفرع" error={errors.name?.message} {...register('name')} />
          <Input label="العنوان (اختياري)" {...register('address')} />
          <Input
            label="الهاتف (اختياري)"
            dir="ltr"
            className="text-start"
            error={errors.phone?.message}
            {...register('phone')}
          />
          {save.error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-danger sm:col-span-2">
              {save.error}
            </p>
          )}
          <Button type="submit" loading={save.loading} className="sm:col-span-2">
            إضافة فرع
          </Button>
        </form>
      </Card>

      <ListState
        loading={loading}
        error={error}
        isEmpty={items.length === 0}
        emptyTitle="لا توجد فروع بعد"
        onRetry={refresh}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((b) => (
            <Card key={b.id} interactive className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold-500/15 text-gold-500"
              >
                <MapPin />
              </span>
              <div>
                <p className="font-bold text-navy-900">{b.name}</p>
                <p className="text-small text-muted">
                  {b.governorateName}
                  {b.address ? `، ${b.address}` : ''}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </ListState>
    </div>
  );
}
