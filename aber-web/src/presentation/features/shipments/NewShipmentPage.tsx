import { zodResolver } from '@hookform/resolvers/zod';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
  createShipmentSchema,
  type CreateShipmentForm,
} from '@/application/useCases/createShipment';
import { GOODS_TYPE_LABEL, type GoodsType, type Shipment } from '@/domain/entities/Shipment';
import { QrLabel } from '@/presentation/components/shared/QrLabel';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Input } from '@/presentation/components/ui/Input';
import { Select } from '@/presentation/components/ui/Select';
import { Spinner } from '@/presentation/components/ui/Spinner';
import { useAuthStore } from '@/presentation/stores/authStore';
import { useBranches } from './hooks/useBranches';
import { useCreateShipment } from './hooks/useCreateShipment';
import { useState } from 'react';

const GOODS = Object.keys(GOODS_TYPE_LABEL) as GoodsType[];

export function NewShipmentPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const { branches, loading, error } = useBranches();
  const { run, loading: saving, error: saveError } = useCreateShipment();
  const [created, setCreated] = useState<Shipment | null>(null);

  // A branch employee can only send from their own branch.
  const lockedOrigin = user?.role === 'branch_staff' ? (user.branchId ?? '') : '';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateShipmentForm>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: { originBranchId: lockedOrigin, goodsType: 'normal', codAmount: 0 },
  });

  const onSubmit = async (form: CreateShipmentForm): Promise<void> => {
    try {
      setCreated(await run(form));
    } catch {
      // The error is already stored by useAsyncAction and shown below.
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  if (created) {
    return (
      <Card variant="highlight" className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-navy-900 text-[20px] font-bold">تم إنشاء الشحنة</h2>
        <QrLabel trackingNumber={created.trackingNumber} />
        <p>
          السعر: <strong dir="ltr">{created.price}</strong>
        </p>
        <div className="rounded-md bg-gold-100 px-4 py-3">
          <p className="text-small text-muted">رمز التسليم (يظهر هذه المرة فقط، سلّمه للمستلم)</p>
          <p dir="ltr" className="font-mono text-[26px] font-extrabold tracking-widest">
            {created.deliveryOtp}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to={`/branch/shipments/${encodeURIComponent(created.trackingNumber)}`}
            className="inline-flex h-11 items-center rounded-md bg-navy-900 px-5 font-semibold text-white"
          >
            فتح الشحنة
          </Link>
          <Button
            variant="secondary"
            onClick={() => {
              setCreated(null);
              reset();
            }}
          >
            شحنة أخرى
          </Button>
        </div>
      </Card>
    );
  }

  const options = branches.map((b) => (
    <option key={b.id} value={b.id}>
      {b.governorateName} - {b.name}
    </option>
  ));

  return (
    <Card className="mx-auto max-w-2xl">
      <h2 className="mb-4 text-navy-900 text-[20px] font-bold">شحنة جديدة</h2>
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
        className="grid gap-4 sm:grid-cols-2"
      >
        <Select
          label="فرع الانطلاق"
          disabled={Boolean(lockedOrigin)}
          error={errors.originBranchId?.message}
          {...register('originBranchId')}
        >
          <option value="">اختر الفرع</option>
          {options}
        </Select>
        <Select
          label="فرع الوجهة"
          error={errors.destBranchId?.message}
          {...register('destBranchId')}
        >
          <option value="">اختر الفرع</option>
          {options}
        </Select>
        <Input label="اسم المرسل" error={errors.senderName?.message} {...register('senderName')} />
        <Input
          label="هاتف المرسل"
          dir="ltr"
          className="text-start"
          error={errors.senderPhone?.message}
          {...register('senderPhone')}
        />
        <Input
          label="اسم المستلم"
          error={errors.receiverName?.message}
          {...register('receiverName')}
        />
        <Input
          label="هاتف المستلم"
          dir="ltr"
          className="text-start"
          error={errors.receiverPhone?.message}
          {...register('receiverPhone')}
        />
        <Select label="نوع البضاعة" error={errors.goodsType?.message} {...register('goodsType')}>
          {GOODS.map((g) => (
            <option key={g} value={g}>
              {GOODS_TYPE_LABEL[g]}
            </option>
          ))}
        </Select>
        <Input
          label="الوزن (كغ)"
          type="number"
          step="0.01"
          dir="ltr"
          className="text-start"
          error={errors.weightKg?.message}
          {...register('weightKg')}
        />
        <Input
          label="مبلغ الدفع عند الاستلام"
          type="number"
          dir="ltr"
          className="text-start"
          hint="اتركه 0 إن لم يكن هناك مبلغ"
          error={errors.codAmount?.message}
          {...register('codAmount')}
        />
        {saveError && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-danger sm:col-span-2">
            {saveError}
          </p>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving} className="w-full sm:w-auto">
            إنشاء الشحنة
          </Button>
        </div>
      </form>
    </Card>
  );
}
