import type { JSX } from 'react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Input } from '@/presentation/components/ui/Input';
import { StatusBadge } from '@/presentation/components/ui/StatusBadge';
import { Timeline } from '@/presentation/components/ui/Timeline';
import { useTrackShipment } from './hooks/useTrackShipment';

// Public page: no login needed.
export function TrackPage(): JSX.Element {
  const [number, setNumber] = useState('');
  const { track, result, loading, error } = useTrackShipment();

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (number.trim()) track(number).catch(() => undefined);
  };

  return (
    <main className="min-h-screen bg-tint flex flex-col items-center gap-6 p-6">
      <header className="text-center pt-8">
        <h1 className="text-navy-900 text-[32px] font-extrabold">عابر</h1>
        <p className="text-muted">تتبّع شحنتك برقم البوليصة</p>
      </header>

      <Card variant="highlight" className="w-full max-w-md">
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
        <Card className="w-full max-w-md">
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

      <Link to="/login" className="text-navy-700 underline">
        دخول الموظفين
      </Link>
    </main>
  );
}
