import { zodResolver } from '@hookform/resolvers/zod';
import type { JSX } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { createStaff } from '@/app/container';
import { createStaffSchema, type CreateStaffForm } from '@/application/useCases/createStaff';
import { STAFF_ROLE_LABEL } from '@/domain/entities/Staff';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Input } from '@/presentation/components/ui/Input';
import { Select } from '@/presentation/components/ui/Select';
import { useSubmit } from '@/presentation/hooks/useSubmit';
import { useBranchList, useStaffList } from './hooks';
import { ListState } from './ListState';

export function StaffPage(): JSX.Element {
  const staff = useStaffList();
  const branches = useBranchList();
  const save = useSubmit(createStaff, 'تمت إضافة الحساب', staff.refresh);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateStaffForm>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { role: 'branch_staff' },
  });
  const role = useWatch({ control, name: 'role' });

  const onSubmit = (form: CreateStaffForm): Promise<void> =>
    save
      .run(form)
      .then(() => reset())
      .catch(() => undefined);

  const branchName = (id: string | null): string =>
    branches.items.find((b) => b.id === id)?.name ?? '-';

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[20px] font-bold text-navy-900">الموظفون والسائقون</h2>
      <Card variant="highlight">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <Input label="الاسم الكامل" error={errors.fullName?.message} {...register('fullName')} />
          <Select label="الدور" {...register('role')}>
            <option value="branch_staff">{STAFF_ROLE_LABEL.branch_staff}</option>
            <option value="line_driver">{STAFF_ROLE_LABEL.line_driver}</option>
          </Select>
          <Input
            label="البريد الإلكتروني"
            type="email"
            dir="ltr"
            className="text-start"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="كلمة المرور"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            className="text-start"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="الهاتف (اختياري)"
            dir="ltr"
            className="text-start"
            error={errors.phone?.message}
            {...register('phone')}
          />
          {role === 'branch_staff' && (
            <Select label="الفرع" error={errors.branchId?.message} {...register('branchId')}>
              <option value="">اختر...</option>
              {branches.items.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          {save.error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-danger sm:col-span-2">
              {save.error}
            </p>
          )}
          <Button type="submit" loading={save.loading} className="sm:col-span-2">
            إضافة حساب
          </Button>
        </form>
      </Card>

      <ListState
        loading={staff.loading}
        error={staff.error}
        isEmpty={staff.items.length === 0}
        emptyTitle="لا يوجد موظفون بعد"
        onRetry={staff.refresh}
      >
        <Card flush>
          <ul>
            {staff.items.map((m) => (
              <li
                key={m.id}
                className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-2 last:border-b-0"
              >
                <span>
                  <p className="font-bold text-navy-900">{m.fullName}</p>
                  <p dir="ltr" className="text-start text-small text-muted">
                    {m.email}
                  </p>
                </span>
                <span className="flex items-center gap-3 text-small">
                  <span className="rounded-full bg-gold-500/15 px-3 py-0.5 font-semibold text-gold-500">
                    {STAFF_ROLE_LABEL[m.role]}
                  </span>
                  {m.role === 'branch_staff' && (
                    <span className="text-muted">{branchName(m.branchId)}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </ListState>
    </div>
  );
}
