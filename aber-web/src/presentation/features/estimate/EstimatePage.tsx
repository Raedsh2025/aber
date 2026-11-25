import { zodResolver } from '@hookform/resolvers/zod';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { estimatePrice } from '@/app/container';
import { estimateSchema, type EstimateForm } from '@/application/useCases/estimatePrice';
import type { PriceEstimate } from '@/domain/entities/PriceEstimate';
import { GOODS_TYPE_LABEL, type GoodsType } from '@/domain/entities/Shipment';
import { Logo } from '@/presentation/components/shared/Logo';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Input } from '@/presentation/components/ui/Input';
import { Select } from '@/presentation/components/ui/Select';
import { Spinner } from '@/presentation/components/ui/Spinner';
import { useAsyncAction } from '@/presentation/hooks/useAsyncAction';
import { useState } from 'react';
import { usePricedGovernorates } from './hooks';

const GOODS = Object.keys(GOODS_TYPE_LABEL) as GoodsType[];
const number = new Intl.NumberFormat('en-US');

// Public page: no login needed. The price is the server's, not computed here.
export function EstimatePage(): JSX.Element {
  const { items: governorates, loading, error, refresh } = usePricedGovernorates();
  const [result, setResult] = useState<PriceEstimate | null>(null);
  const { run, loading: estimating, error: estimateError } = useAsyncAction(estimatePrice);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EstimateForm>({
    resolver: zodResolver(estimateSchema),
    defaultValues: { goodsType: 'normal' },
  });

  const onSubmit = async (form: EstimateForm): Promise<void> => {
    setResult(null);
    try {
      setResult(await run(form));
    } catch {
      // Shown through estimateError.
    }
  };

  const nameOf = (code: string): string =>
    governorates.find((g) => g.code === code)?.nameAr ?? code;
  const options = governorates.map((g) => (
    <option key={g.code} value={g.code}>
      {g.nameAr}
    </option>
  ));

  return (
    <main className="bg-page flex min-h-screen flex-col items-center gap-6 pb-10">
      <header className="bg-brand relative w-full overflow-hidden px-6 pt-10 pb-24 text-center text-white">
        <Logo tone="light" size="lg" className="relative" />
        <h1 className="relative mt-5 text-[26px] font-extrabold">كم تكلفة شحنتك؟</h1>
        <p className="relative mt-1 text-white/80">تقدير تقريبي للسعر والمدة، بدون تسجيل دخول</p>
      </header>

      <Card variant="highlight" className="-mt-20 mx-4 w-full max-w-md shadow-lift">
        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={refresh} />}
        {!loading && !error && governorates.length === 0 && (
          <p className="text-center text-muted">لا توجد مسارات مسعّرة حاليًا</p>
        )}
        {!loading && !error && governorates.length > 0 && (
          <form
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
            noValidate
            className="flex flex-col gap-4"
          >
            <Select label="من محافظة" error={errors.from?.message} {...register('from')}>
              <option value="">اختر المحافظة</option>
              {options}
            </Select>
            <Select label="إلى محافظة" error={errors.to?.message} {...register('to')}>
              <option value="">اختر المحافظة</option>
              {options}
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
            <Select
              label="نوع البضاعة"
              error={errors.goodsType?.message}
              {...register('goodsType')}
            >
              {GOODS.map((g) => (
                <option key={g} value={g}>
                  {GOODS_TYPE_LABEL[g]}
                </option>
              ))}
            </Select>
            <Button type="submit" loading={estimating}>
              احسب السعر
            </Button>
          </form>
        )}
        {estimateError && (
          <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-danger">
            {estimateError}
          </p>
        )}
      </Card>

      {result && (
        <Card className="mx-4 w-full max-w-md text-center">
          <p className="text-muted">
            {nameOf(result.from)} ← {nameOf(result.to)}
          </p>
          <p className="mt-2 text-small text-muted">السعر التقديري</p>
          <p dir="ltr" className="text-[28px] font-extrabold text-navy-900">
            {number.format(result.price)}
          </p>
          <p className="text-muted">
            المدة التقريبية: <span dir="ltr">{result.estHours}</span> ساعة
          </p>
          <p className="mt-3 text-small text-muted">السعر النهائي يحدده الفرع عند استلام الشحنة.</p>
        </Card>
      )}

      <nav className="flex gap-4">
        <Link to="/" className="font-semibold text-navy-700 underline-offset-4 hover:underline">
          تتبّع شحنة
        </Link>
        <Link
          to="/login"
          className="font-semibold text-navy-700 underline-offset-4 hover:underline"
        >
          دخول الموظفين
        </Link>
      </nav>
    </main>
  );
}
