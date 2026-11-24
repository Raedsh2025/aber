import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { deliverShipment } from '@/app/container';
import type { Shipment } from '@/domain/entities/Shipment';
import { useAsyncAction } from '@/presentation/hooks/useAsyncAction';
import { useShipmentStore } from '@/presentation/stores/shipmentStore';

export function useDeliver() {
  const upsert = useShipmentStore((s) => s.upsert);

  const action = useCallback(
    async (shipment: Shipment, otp: string): Promise<Shipment> => {
      const updated = await deliverShipment(shipment, otp);
      upsert(updated);
      toast.success('تم تسليم الشحنة');
      return updated;
    },
    [upsert],
  );

  return useAsyncAction(action);
}
