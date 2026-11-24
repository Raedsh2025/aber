import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { advanceTripStatus, scanShipment } from '@/app/container';
import type { ScanResult, Trip } from '@/domain/entities/Trip';
import { useAsyncAction } from '@/presentation/hooks/useAsyncAction';

const SAME_CODE_COOLDOWN_MS = 3000;

/** Moves a trip to its next status (start loading, depart, arrive). */
export function useAdvanceTrip(onDone: () => void) {
  const action = useCallback(
    async (trip: Trip): Promise<Trip> => {
      const updated = await advanceTripStatus(trip);
      toast.success('تم تحديث حالة الرحلة');
      onDone();
      return updated;
    },
    [onDone],
  );
  return useAsyncAction(action);
}

/** Scans one tracking number. The camera reports the same QR many times per second. */
export function useScan(trip: Trip, onDone: () => void) {
  const last = useRef<{ code: string; at: number } | null>(null);

  const action = useCallback(
    async (code: string): Promise<ScanResult | null> => {
      const now = Date.now();
      if (
        last.current &&
        last.current.code === code &&
        now - last.current.at < SAME_CODE_COOLDOWN_MS
      ) {
        return null;
      }
      last.current = { code, at: now };
      const result = await scanShipment(trip, code);
      toast.success(result.duplicate ? 'تم مسح هذه الشحنة سابقًا' : 'تم تسجيل المسح');
      onDone();
      return result;
    },
    [trip, onDone],
  );
  return useAsyncAction(action);
}
