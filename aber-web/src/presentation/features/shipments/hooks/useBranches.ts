import { useEffect, useState } from 'react';
import { branchRepository } from '@/app/container';
import type { Branch } from '@/domain/entities/Branch';

export function useBranches(): { branches: Branch[]; loading: boolean; error: string | null } {
  const [state, setState] = useState<{
    branches: Branch[];
    loading: boolean;
    error: string | null;
  }>({
    branches: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    branchRepository
      .list()
      .then((branches) => {
        if (!cancelled) setState({ branches, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            branches: [],
            loading: false,
            error: e instanceof Error ? e.message : 'تعذّر تحميل الفروع',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
