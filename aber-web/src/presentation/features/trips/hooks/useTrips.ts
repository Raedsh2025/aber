import { useCallback, useEffect, useState } from 'react';
import { tripRepository } from '@/app/container';
import type { Trip } from '@/domain/entities/Trip';

interface TripsState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
}

export function useTrips(): TripsState & { refresh: () => void } {
  const [state, setState] = useState<TripsState>({ trips: [], loading: true, error: null });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    tripRepository
      .list()
      .then((trips) => {
        if (!cancelled) setState({ trips, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            trips: [],
            loading: false,
            error: e instanceof Error ? e.message : 'تعذّر تحميل الرحلات',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { ...state, refresh };
}
