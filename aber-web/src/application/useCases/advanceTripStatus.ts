import type { Trip } from '@/domain/entities/Trip';
import type { TripRepository } from '@/domain/repositories/TripRepository';
import { nextTripStatus } from '@/domain/services/tripStatus';

export const makeAdvanceTripStatus =
  (repo: TripRepository) =>
  (trip: Trip): Promise<Trip> => {
    const next = nextTripStatus(trip.status);
    if (!next) throw new Error('الرحلة مغلقة');
    return repo.changeStatus(trip.id, next);
  };
