import { useEffect, useState } from 'react';
import { accountRepository } from '@/app/container';
import type { MyShipment } from '@/domain/entities/MyShipment';

interface MyShipmentsState {
  shipments: MyShipment[];
  loading: boolean;
  error: string | null;
}

export function useMyShipments(): MyShipmentsState {
  const [state, setState] = useState<MyShipmentsState>({
    shipments: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    accountRepository
      .listMyShipments()
      .then((shipments) => {
        if (!cancelled) setState({ shipments, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            shipments: [],
            loading: false,
            error: e instanceof Error ? e.message : 'تعذّر تحميل الشحنات',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
