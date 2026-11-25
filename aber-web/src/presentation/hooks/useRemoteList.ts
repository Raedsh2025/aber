import { useCallback, useEffect, useState } from 'react';

interface ListState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

/** Loads a list once and again on refresh. Pass a stable load function. */
export function useRemoteList<T>(
  load: () => Promise<T[]>,
  errorMessage: string,
): ListState<T> & { refresh: () => void } {
  const [state, setState] = useState<ListState<T>>({ items: [], loading: true, error: null });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((items) => {
        if (!cancelled) setState({ items, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            items: [],
            loading: false,
            error: e instanceof Error ? e.message : errorMessage,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [load, errorMessage, version]);

  return { ...state, refresh };
}
