import { useCallback, useEffect, useState } from 'react';
import { tripRepository } from '@/app/container';
import type { Manifest } from '@/domain/entities/Trip';

interface ManifestState {
  manifest: Manifest | null;
  loading: boolean;
  error: string | null;
}

export function useManifest(tripId: string): ManifestState & { reload: () => void } {
  const [state, setState] = useState<ManifestState>({ manifest: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    tripRepository
      .getManifest(tripId)
      .then((manifest) => {
        if (!cancelled) setState({ manifest, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            manifest: null,
            loading: false,
            error: e instanceof Error ? e.message : 'تعذّر تحميل بيان الرحلة',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, version]);

  return { ...state, reload };
}
