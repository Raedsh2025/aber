import type { JSX } from 'react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Logo } from '@/presentation/components/shared/Logo';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Input } from '@/presentation/components/ui/Input';
import { StatusBadge } from '@/presentation/components/ui/StatusBadge';
import { Timeline } from '@/presentation/components/ui/Timeline';
import { useTrackShipment } from './hooks/useTrackShipment';

// Public page: no login needed.
export function TrackPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const initialNumber = searchParams.get('track') ?? '';
  const [number, setNumber] = useState(initialNumber);
  const { track, result, loading, error } = useTrackShipment();

  // A link like /?track=AB26... (from the account page) tracks it right away.
  const autoTracked = useRef(false);
  useEffect(() => {
    if (!autoTracked.current && initialNumber) {
      autoTracked.current = true;
      track(initialNumber).catch(() => undefined);
    }
  }, [initialNumber, track]);

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (number.trim()) track(number).catch(() => undefined);
  };

  return (
    <main className="bg-page flex min-h-screen flex-col items-center gap-6 pb-10">
      <header className="bg-brand relative w-full overflow-hidden px-6 pt-10 pb-24 text-center text-white">
        <span
          aria-hidden="true"
          className="animate-float absolute -bottom-20 -start-16 h-56 w-56 rounded-full border-[24px] border-gold-500/25"
        />
        <Logo tone="light" size="lg" className="relative" />
        <h1 className="relative mt-5 text-[26px] font-extrabold">أين شحنتك الآن؟</h1>
        <p className="relative mt-1 text-white/80">تتبّع شحنتك برقم البوليصة، بدون تسجيل دخول</p>
      </header>

      <Card variant="highlight" className="-mt-20 mx-4 w-full max-w-md shadow-lift">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="رقم البوليصة"
            dir="ltr"
            className="text-start"
            placeholder="AB26..."
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <Button type="submit" loading={loading}>
            تتبّع
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-danger">
            {error}
          </p>
        )}
      </Card>

      {result && (
        <Card className="mx-4 w-full max-w-md">
          <div className="flex items-center justify-between gap-3">
            <span dir="ltr" className="font-mono font-bold text-navy-900">
              {result.trackingNumber}
            </span>
            <StatusBadge status={result.status} />
          </div>
          <p className="mt-2 text-muted">
            {result.originGovernorate} ← {result.destGovernorate}
          </p>
          <h2 className="mt-4 mb-2 font-bold text-navy-900">سجل الشحنة</h2>
          <Timeline items={result.history} />
        </Card>
      )}

      <nav className="flex gap-4">
        <Link
          to="/estimate"
          className="font-semibold text-navy-700 underline-offset-4 hover:underline"
        >
          احسب سعر الشحن
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
