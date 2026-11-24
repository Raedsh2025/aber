import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ShipmentFilters } from '@/domain/repositories/ShipmentRepository';
import { useShipmentStore } from '@/presentation/stores/shipmentStore';

export function useShipments(filters: ShipmentFilters = {}) {
  const { items, loading, error, fetch } = useShipmentStore(
    useShallow((s) => ({ items: s.items, loading: s.loading, error: s.error, fetch: s.fetch })),
  );

  const key = JSON.stringify(filters); // A stable key instead of a new object on every render.
  useEffect(() => {
    void fetch(JSON.parse(key) as ShipmentFilters);
  }, [key, fetch]);

  const refresh = useCallback(() => fetch(JSON.parse(key) as ShipmentFilters), [key, fetch]);
  return { shipments: items, loading, error, refresh };
}
