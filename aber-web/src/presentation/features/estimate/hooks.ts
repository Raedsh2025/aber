import { useEffect, useState } from 'react';
import { estimateRepository } from '@/app/container';
import type { PriceEstimate, PriceEstimateQuery } from '@/domain/entities/PriceEstimate';
import { useRemoteList } from '@/presentation/hooks/useRemoteList';

const loadGovernorates = () => estimateRepository.governorates();
export const usePricedGovernorates = () => useRemoteList(loadGovernorates, 'تعذّر تحميل المحافظات');

const DEBOUNCE_MS = 400;

interface Settled {
  key: string;
  estimate: PriceEstimate | null;
  error: string | null;
}

/** Live price for a form. Pass null while the inputs are incomplete. Waits briefly while the user types. */
export function useLivePrice(query: PriceEstimateQuery | null): {
  estimate: PriceEstimate | null;
  loading: boolean;
  error: string | null;
} {
  const [settled, setSettled] = useState<Settled | null>(null);
  const key = query ? JSON.stringify(query) : '';

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      estimateRepository
        .estimate(JSON.parse(key) as PriceEstimateQuery)
        .then((estimate) => {
          if (!cancelled) setSettled({ key, estimate, error: null });
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setSettled({
              key,
              estimate: null,
              error: e instanceof Error ? e.message : 'تعذّر حساب السعر',
            });
          }
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key]);

  if (!key) return { estimate: null, loading: false, error: null };
  if (settled?.key !== key) return { estimate: null, loading: true, error: null };
  return { estimate: settled.estimate, loading: false, error: settled.error };
}
