import { z } from 'zod';
import type { ScanResult, Trip } from '@/domain/entities/Trip';
import type { TripRepository } from '@/domain/repositories/TripRepository';
import { scanTypeFor } from '@/domain/services/tripStatus';

export const trackingNumberSchema = z.string().trim().min(1, 'أدخل رقم البوليصة').max(30);

export const makeScanShipment =
  (repo: TripRepository) =>
  (trip: Trip, rawTrackingNumber: string): Promise<ScanResult> => {
    const type = scanTypeFor(trip.status);
    if (!type) throw new Error('المسح غير متاح في حالة الرحلة الحالية');
    return repo.scan(trip.id, trackingNumberSchema.parse(rawTrackingNumber), type);
  };
