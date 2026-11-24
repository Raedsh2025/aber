import { useCallback, useState } from 'react';
import { shipmentRepository } from '@/app/container';
import type { PublicTracking } from '@/domain/entities/Shipment';
import { useAsyncAction } from '@/presentation/hooks/useAsyncAction';

export function useTrackShipment() {
  const [result, setResult] = useState<PublicTracking | null>(null);

  const fetchTracking = useCallback(async (trackingNumber: string): Promise<PublicTracking> => {
    setResult(null);
    const data = await shipmentRepository.trackPublic(trackingNumber.trim());
    setResult(data);
    return data;
  }, []);

  const { run, loading, error } = useAsyncAction(fetchTracking);
  return { track: run, result, loading, error };
}
