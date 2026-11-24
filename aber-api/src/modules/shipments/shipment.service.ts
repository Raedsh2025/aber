import { createHash, randomInt } from 'node:crypto';
import type { AuthUser } from '../../middlewares/authenticate';
import { AppError } from '../../shared/AppError';
import { canTransition, type ShipmentStatus } from '../../shared/domain/shipmentStatus';
import { calculatePrice } from './pricing';
import type { PublicTracking, ShipmentDto, ShipmentRepository } from './shipment.repository';
import type { CreateShipmentBody, ListQuery } from './shipment.schema';

export const MAX_OTP_ATTEMPTS = 5;
const OTP_MIN = 100_000;
const OTP_MAX_EXCLUSIVE = 1_000_000;
const DRIVER_ALLOWED: ShipmentStatus[] = ['loaded', 'in_transit', 'arrived', 'issue'];

const hashOtp = (otp: string): string => createHash('sha256').update(otp).digest('hex');

/** Runs the work in one database transaction. The real one is wired in server.ts. */
export type Transaction = <T>(work: (tx: ShipmentRepository) => Promise<T>) => Promise<T>;

export type CreatedShipment = ShipmentDto & { deliveryOtp: string };

export interface ShipmentService {
  create(user: AuthUser, body: CreateShipmentBody): Promise<CreatedShipment>;
  list(user: AuthUser, filters: ListQuery): Promise<ShipmentDto[]>;
  getByTracking(user: AuthUser, trackingNumber: string): Promise<ShipmentDto>;
  changeStatus(
    user: AuthUser,
    id: string,
    next: ShipmentStatus,
    note?: string,
  ): Promise<ShipmentDto>;
  deliver(user: AuthUser, id: string, otp: string): Promise<ShipmentDto>;
  trackPublic(trackingNumber: string): Promise<PublicTracking>;
}

function assertSameCompany(user: AuthUser, companyId: string): void {
  if (user.role !== 'system_admin' && user.companyId !== companyId) {
    throw new AppError(403, 'FORBIDDEN', 'لا تملك صلاحية على هذه الشحنة');
  }
}

async function mustFind(repo: ShipmentRepository, id: string, lock = false): Promise<ShipmentDto> {
  const shipment = await repo.findById(id, lock);
  if (!shipment) throw new AppError(404, 'NOT_FOUND', 'الشحنة غير موجودة');
  return shipment;
}

export function createShipmentService(
  repo: ShipmentRepository,
  transaction: Transaction,
): ShipmentService {
  return {
    async create(user, body) {
      const companyId = user.companyId;
      if (!companyId) throw new AppError(403, 'FORBIDDEN', 'حسابك غير مرتبط بشركة');
      if (user.role === 'branch_staff' && body.originBranchId !== user.branchId) {
        throw new AppError(403, 'FORBIDDEN', 'يمكنك تسجيل الشحنات من فرعك فقط');
      }

      const branches = await repo.findBranches([body.originBranchId, body.destBranchId]);
      const origin = branches.find((b) => b.id === body.originBranchId);
      const dest = branches.find((b) => b.id === body.destBranchId);
      if (!origin || !dest || origin.company_id !== companyId || dest.company_id !== companyId) {
        throw new AppError(422, 'INVALID_BRANCH', 'فرع غير صالح');
      }

      const route = await repo.findRoutePrice(origin.governorate_code, dest.governorate_code);
      if (!route) throw new AppError(422, 'NO_ROUTE_PRICE', 'لا يوجد سعر معرّف لهذا المسار');

      // The official price is always computed here and never accepted from the client.
      const price = calculatePrice(route, body.weightKg, body.goodsType);
      const otp = String(randomInt(OTP_MIN, OTP_MAX_EXCLUSIVE));

      return transaction(async (tx) => {
        const id = await tx.insert({
          ...body,
          companyId,
          price,
          otpHash: hashOtp(otp),
          createdBy: user.id,
        });
        await tx.insertLog(id, 'received', null, user.id);
        const shipment = await mustFind(tx, id);
        return { ...shipment, deliveryOtp: otp }; // The OTP is shown only this once.
      });
    },

    list(user, filters) {
      const scope = user.role === 'system_admin' ? null : user.companyId;
      return repo.list(filters, scope);
    },

    async getByTracking(user, trackingNumber) {
      const shipment = await repo.findByTracking(trackingNumber);
      if (!shipment) throw new AppError(404, 'NOT_FOUND', 'الشحنة غير موجودة');
      assertSameCompany(user, shipment.companyId);
      return shipment;
    },

    async changeStatus(user, id, next, note) {
      if (next === 'delivered') {
        throw new AppError(400, 'USE_DELIVER', 'التسليم يتم عبر رمز التحقق');
      }
      if (user.role === 'line_driver' && !DRIVER_ALLOWED.includes(next)) {
        throw new AppError(403, 'FORBIDDEN', 'هذه الحالة ليست من صلاحياتك');
      }

      return transaction(async (tx) => {
        const current = await mustFind(tx, id, true); // Row lock prevents concurrent changes.
        assertSameCompany(user, current.companyId);
        if (!canTransition(current.status, next)) {
          throw new AppError(409, 'INVALID_TRANSITION', 'انتقال الحالة غير مسموح');
        }
        await tx.updateStatus(id, next);
        await tx.insertLog(id, next, note ?? null, user.id);
        return mustFind(tx, id);
      });
    },

    async deliver(user, id, otp) {
      const shipment = await mustFind(repo, id);
      assertSameCompany(user, shipment.companyId);
      if (shipment.status !== 'arrived') {
        throw new AppError(409, 'NOT_ARRIVED', 'لا يمكن التسليم قبل وصول الشحنة');
      }

      // Attempts are counted outside the transaction so a rejection does not roll the counter back.
      const state = await repo.getOtpState(id);
      if (!state) throw new AppError(404, 'NOT_FOUND', 'الشحنة غير موجودة');
      if (state.attempts >= MAX_OTP_ATTEMPTS) {
        throw new AppError(429, 'OTP_LOCKED', 'تم تجاوز عدد المحاولات، راجع مدير الفرع');
      }
      if (state.hash !== hashOtp(otp)) {
        await repo.bumpOtpAttempts(id);
        throw new AppError(400, 'WRONG_OTP', 'رمز التحقق غير صحيح');
      }

      return transaction(async (tx) => {
        const current = await mustFind(tx, id, true);
        if (current.status !== 'arrived') {
          throw new AppError(409, 'NOT_ARRIVED', 'حالة الشحنة تغيّرت');
        }
        await tx.updateStatus(id, 'delivered');
        await tx.insertLog(id, 'delivered', null, user.id);
        if (current.codAmount > 0) {
          await tx.insertCollection({
            shipmentId: id,
            branchId: user.branchId ?? current.destBranchId,
            amount: current.codAmount,
            collectedBy: user.id,
          });
        }
        return mustFind(tx, id);
      });
    },

    async trackPublic(trackingNumber) {
      const data = await repo.publicTracking(trackingNumber);
      if (!data) throw new AppError(404, 'NOT_FOUND', 'رقم البوليصة غير صحيح');
      return data;
    },
  };
}
