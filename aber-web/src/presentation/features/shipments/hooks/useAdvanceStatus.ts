import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { advanceShipmentStatus } from '@/app/container';
import type { Shipment, ShipmentStatus } from '@/domain/entities/Shipment';
import { useAsyncAction } from '@/presentation/hooks/useAsyncAction';
import { useShipmentStore } from '@/presentation/stores/shipmentStore';

export function useAdvanceStatus() {
  const upsert = useShipmentStore((s) => s.upsert);

  const action = useCallback(
    async (shipment: Shipment, next: ShipmentStatus, note?: string): Promise<Shipment> => {
      const updated = await advanceShipmentStatus(shipment, next, note);
      upsert(updated);
      toast.success('تم تحديث حالة الشحنة');
      return updated;
    },
    [upsert],
  );

  return useAsyncAction(action);
}
