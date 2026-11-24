import { makeAdvanceShipmentStatus } from '@/application/useCases/advanceShipmentStatus';
import { makeCreateShipment } from '@/application/useCases/createShipment';
import { makeAdvanceTripStatus } from '@/application/useCases/advanceTripStatus';
import { makeDeliverShipment } from '@/application/useCases/deliverShipment';
import { makeScanShipment } from '@/application/useCases/scanTrip';
import { ApiAuthRepository } from '@/infrastructure/repositories/ApiAuthRepository';
import { ApiBranchRepository } from '@/infrastructure/repositories/ApiBranchRepository';
import { ApiShipmentRepository } from '@/infrastructure/repositories/ApiShipmentRepository';
import { ApiTripRepository } from '@/infrastructure/repositories/ApiTripRepository';

// The only place that knows the real implementations. Tests replace it with fakes.
export const authRepository = new ApiAuthRepository();
export const shipmentRepository = new ApiShipmentRepository();
export const branchRepository = new ApiBranchRepository();
export const tripRepository = new ApiTripRepository();

export const createShipment = makeCreateShipment(shipmentRepository);
export const advanceShipmentStatus = makeAdvanceShipmentStatus(shipmentRepository);
export const deliverShipment = makeDeliverShipment(shipmentRepository);
export const scanShipment = makeScanShipment(tripRepository);
export const advanceTripStatus = makeAdvanceTripStatus(tripRepository);
