import type { AuthUser } from '../../middlewares/authenticate';
import { AppError } from '../../shared/AppError';
import { canTransition } from '../../shared/domain/shipmentStatus';
import { canTripTransition, type TripStatus } from '../../shared/domain/tripStatus';
import type { ShipmentDto, ShipmentRepository } from '../shipments/shipment.repository';
import { matchManifest, type ManifestRow, type ManifestSummary } from './manifest';
import type { TripDto, TripRepository, TripSuggestion } from './trip.repository';
import type { CreateTripBody, ScanBody, SuggestQuery, TripListQuery } from './trip.schema';

export interface TripRepos {
  trips: TripRepository;
  shipments: ShipmentRepository;
}

/** Runs the work in one database transaction. The real one is wired in server.ts. */
export type TripTransaction = <T>(work: (tx: TripRepos) => Promise<T>) => Promise<T>;

export interface ScanResult {
  duplicate: boolean;
  shipment: ShipmentDto;
}

export interface TripService {
  create(user: AuthUser, body: CreateTripBody): Promise<TripDto>;
  list(user: AuthUser, filters: TripListQuery): Promise<TripDto[]>;
  suggest(user: AuthUser, query: SuggestQuery): Promise<TripSuggestion[]>;
  manifest(
    user: AuthUser,
    tripId: string,
  ): Promise<{ trip: TripDto; shipments: ManifestRow[]; summary: ManifestSummary }>;
  assign(user: AuthUser, tripId: string, shipmentId: string): Promise<TripDto>;
  scan(user: AuthUser, tripId: string, body: ScanBody): Promise<ScanResult>;
  changeStatus(user: AuthUser, tripId: string, next: TripStatus): Promise<TripDto>;
}

function requireCompany(user: AuthUser): string {
  if (!user.companyId) throw new AppError(403, 'FORBIDDEN', 'حسابك غير مرتبط بشركة');
  return user.companyId;
}

/** Company scope for everyone. A driver can only work on trips assigned to them. */
function assertTripAccess(user: AuthUser, trip: TripDto): void {
  if (trip.companyId !== user.companyId) {
    throw new AppError(403, 'FORBIDDEN', 'لا تملك صلاحية على هذه الرحلة');
  }
  if (user.role === 'line_driver' && trip.driverId !== user.id) {
    throw new AppError(403, 'FORBIDDEN', 'هذه الرحلة ليست مسندة إليك');
  }
}

async function mustFindTrip(repo: TripRepository, id: string, lock = false): Promise<TripDto> {
  const trip = await repo.findById(id, lock);
  if (!trip) throw new AppError(404, 'NOT_FOUND', 'الرحلة غير موجودة');
  return trip;
}

export function createTripService(repos: TripRepos, transaction: TripTransaction): TripService {
  return {
    async create(user, body) {
      const companyId = requireCompany(user);
      const branches = await repos.trips.findBranchCompanies([body.fromBranchId, body.toBranchId]);
      const sameCompany =
        branches.length === 2 && branches.every((b) => b.company_id === companyId);
      if (!sameCompany) throw new AppError(422, 'INVALID_BRANCH', 'فرع غير صالح');

      if (body.driverId) {
        const driver = await repos.trips.findDriver(body.driverId);
        if (
          !driver ||
          driver.company_id !== companyId ||
          driver.role !== 'line_driver' ||
          !driver.is_active
        ) {
          throw new AppError(422, 'INVALID_DRIVER', 'سائق غير صالح');
        }
      }

      let capacityKg = body.capacityKg;
      if (body.vehicleId) {
        const vehicle = await repos.trips.findVehicle(body.vehicleId);
        if (!vehicle || vehicle.company_id !== companyId || !vehicle.is_active) {
          throw new AppError(422, 'INVALID_VEHICLE', 'مركبة غير صالحة');
        }
        capacityKg = Math.min(capacityKg ?? vehicle.capacity_kg, vehicle.capacity_kg);
      }
      if (capacityKg === undefined) throw new AppError(400, 'VALIDATION_ERROR', 'السعة مطلوبة');

      const id = await repos.trips.insert({
        companyId,
        fromBranchId: body.fromBranchId,
        toBranchId: body.toBranchId,
        driverId: body.driverId ?? null,
        vehicleId: body.vehicleId ?? null,
        departureAt: body.departureAt,
        estimatedArrivalAt: body.estimatedArrivalAt ?? null,
        capacityKg,
      });
      return mustFindTrip(repos.trips, id);
    },

    list(user, filters) {
      const companyId = requireCompany(user);
      return repos.trips.list(filters, companyId, user.role === 'line_driver' ? user.id : null);
    },

    suggest(user, q) {
      return repos.trips.suggest(
        requireCompany(user),
        q.originBranchId,
        q.destBranchId,
        q.weightKg,
      );
    },

    async manifest(user, tripId) {
      const trip = await mustFindTrip(repos.trips, tripId);
      assertTripAccess(user, trip);
      const shipments = await repos.trips.manifest(tripId);
      return { trip, shipments, summary: matchManifest(shipments) };
    },

    async assign(user, tripId, shipmentId) {
      return transaction(async (tx) => {
        // Lock the trip first so two assignments cannot both pass the capacity check.
        const trip = await mustFindTrip(tx.trips, tripId, true);
        assertTripAccess(user, trip);
        if (trip.status !== 'scheduled' && trip.status !== 'loading') {
          throw new AppError(409, 'TRIP_NOT_OPEN', 'الرحلة مغلقة أمام الإسناد');
        }

        const shipment = await tx.shipments.findById(shipmentId, true);
        if (!shipment) throw new AppError(404, 'NOT_FOUND', 'الشحنة غير موجودة');
        if (shipment.companyId !== trip.companyId) {
          throw new AppError(403, 'FORBIDDEN', 'لا تملك صلاحية على هذه الشحنة');
        }
        if (
          shipment.originBranchId !== trip.fromBranchId ||
          shipment.destBranchId !== trip.toBranchId
        ) {
          throw new AppError(422, 'ROUTE_MISMATCH', 'مسار الشحنة لا يطابق مسار الرحلة');
        }
        if (shipment.tripId) throw new AppError(409, 'ALREADY_ASSIGNED', 'الشحنة مسندة لرحلة');
        if (shipment.status !== 'received') {
          throw new AppError(409, 'INVALID_STATE', 'يمكن إسناد الشحنات المستلمة فقط');
        }
        if (shipment.weightKg > trip.freeKg) {
          throw new AppError(409, 'CAPACITY_EXCEEDED', 'السعة المتبقية لا تكفي وزن الشحنة', {
            freeKg: trip.freeKg,
            weightKg: shipment.weightKg,
          });
        }

        await tx.trips.assignShipment(tripId, shipmentId);
        return mustFindTrip(tx.trips, tripId);
      });
    },

    async scan(user, tripId, body) {
      return transaction(async (tx) => {
        const trip = await mustFindTrip(tx.trips, tripId, true);
        assertTripAccess(user, trip);

        const found = await tx.shipments.findByTracking(body.trackingNumber);
        if (!found || found.tripId !== tripId) {
          throw new AppError(409, 'NOT_IN_TRIP', 'هذه الشحنة ليست ضمن بيان الرحلة');
        }
        const shipment = (await tx.shipments.findById(found.id, true)) ?? found;

        // Scanning the same QR twice is harmless: nothing changes.
        if (await tx.trips.hasScan(tripId, shipment.id, body.type)) {
          return { duplicate: true, shipment };
        }

        if (body.type === 'load') {
          if (trip.status !== 'scheduled' && trip.status !== 'loading') {
            throw new AppError(409, 'TRIP_NOT_LOADING', 'التحميل غير متاح في حالة الرحلة الحالية');
          }
          if (!canTransition(shipment.status, 'loaded')) {
            throw new AppError(409, 'INVALID_TRANSITION', 'انتقال الحالة غير مسموح');
          }
          if (trip.status === 'scheduled') await tx.trips.updateStatus(tripId, 'loading');
          await tx.shipments.updateStatus(shipment.id, 'loaded');
          await tx.shipments.insertLog(shipment.id, 'loaded', null, user.id);
        } else {
          if (trip.status !== 'in_transit' && trip.status !== 'arrived') {
            throw new AppError(409, 'TRIP_NOT_ARRIVING', 'مسح الوصول متاح بعد انطلاق الرحلة');
          }
          if (!(await tx.trips.hasScan(tripId, shipment.id, 'load'))) {
            throw new AppError(409, 'NOT_LOADED', 'الشحنة لم تُمسح عند التحميل');
          }
          if (!canTransition(shipment.status, 'arrived')) {
            throw new AppError(409, 'INVALID_TRANSITION', 'انتقال الحالة غير مسموح');
          }
          await tx.shipments.updateStatus(shipment.id, 'arrived');
          await tx.shipments.insertLog(shipment.id, 'arrived', null, user.id);
        }

        await tx.trips.insertScan(tripId, shipment.id, body.type, user.id);
        const updated = (await tx.shipments.findById(shipment.id)) ?? shipment;
        return { duplicate: false, shipment: updated };
      });
    },

    async changeStatus(user, tripId, next) {
      return transaction(async (tx) => {
        const trip = await mustFindTrip(tx.trips, tripId, true);
        assertTripAccess(user, trip);
        if (user.role === 'line_driver' && next === 'closed') {
          throw new AppError(403, 'FORBIDDEN', 'إغلاق الرحلة من صلاحية الموظف أو المدير');
        }
        if (!canTripTransition(trip.status, next)) {
          throw new AppError(409, 'INVALID_TRANSITION', 'انتقال حالة الرحلة غير مسموح');
        }

        const rows = await tx.trips.manifest(tripId);
        if (next === 'in_transit') {
          const loaded = rows.filter((r) => r.loaded);
          if (loaded.length === 0) {
            throw new AppError(409, 'EMPTY_TRIP', 'لا توجد شحنات محمّلة في الرحلة');
          }
          for (const row of loaded) {
            await tx.shipments.updateStatus(row.id, 'in_transit');
            await tx.shipments.insertLog(row.id, 'in_transit', null, user.id);
          }
        }
        if (next === 'closed') {
          const { missing } = matchManifest(rows);
          if (missing.length > 0) {
            throw new AppError(409, 'MANIFEST_MISMATCH', 'يوجد نقص في بيان الوصول', { missing });
          }
        }

        await tx.trips.updateStatus(tripId, next);
        return mustFindTrip(tx.trips, tripId);
      });
    },
  };
}
