import { useCallback } from 'react';
import { createShipment } from '@/app/container';
import type { Shipment } from '@/domain/entities/Shipment';
import { useAsyncAction } from '@/presentation/hooks/useAsyncAction';
import { useShipmentStore } from '@/presentation/stores/shipmentStore';
import type { CreateShipmentForm } from '@/application/useCases/createShipment';

export function useCreateShipment() {
  const upsert = useShipmentStore((s) => s.upsert);

  const action = useCallback(
    async (form: CreateShipmentForm): Promise<Shipment> => {
      const shipment = await createShipment(form);
      upsert(shipment);
      return shipment;
    },
    [upsert],
  );

  return useAsyncAction(action);
}
