import { makeAdvanceShipmentStatus } from '@/application/useCases/advanceShipmentStatus';
import { makeChangeCompanyStatus } from '@/application/useCases/changeCompanyStatus';
import { makeCreateBranch } from '@/application/useCases/createBranch';
import { makeCreateShipment } from '@/application/useCases/createShipment';
import { makeAdvanceTripStatus } from '@/application/useCases/advanceTripStatus';
import { makeCreateStaff } from '@/application/useCases/createStaff';
import { makeCreateTrip } from '@/application/useCases/createTrip';
import { makeCreateVehicle } from '@/application/useCases/createVehicle';
import { makeDeliverShipment } from '@/application/useCases/deliverShipment';
import { makeScanShipment } from '@/application/useCases/scanTrip';
import { ApiAuthRepository } from '@/infrastructure/repositories/ApiAuthRepository';
import { ApiBranchRepository } from '@/infrastructure/repositories/ApiBranchRepository';
import { ApiCompanyRepository } from '@/infrastructure/repositories/ApiCompanyRepository';
import { ApiStaffRepository } from '@/infrastructure/repositories/ApiStaffRepository';
import { ApiVehicleRepository } from '@/infrastructure/repositories/ApiVehicleRepository';
import { ApiReportRepository } from '@/infrastructure/repositories/ApiReportRepository';
import { ApiShipmentRepository } from '@/infrastructure/repositories/ApiShipmentRepository';
import { ApiTripRepository } from '@/infrastructure/repositories/ApiTripRepository';

// The only place that knows the real implementations. Tests replace it with fakes.
export const authRepository = new ApiAuthRepository();
export const shipmentRepository = new ApiShipmentRepository();
export const branchRepository = new ApiBranchRepository();
export const tripRepository = new ApiTripRepository();
export const vehicleRepository = new ApiVehicleRepository();
export const staffRepository = new ApiStaffRepository();
export const companyRepository = new ApiCompanyRepository();
export const reportRepository = new ApiReportRepository();

export const createShipment = makeCreateShipment(shipmentRepository);
export const advanceShipmentStatus = makeAdvanceShipmentStatus(shipmentRepository);
export const deliverShipment = makeDeliverShipment(shipmentRepository);
export const scanShipment = makeScanShipment(tripRepository);
export const advanceTripStatus = makeAdvanceTripStatus(tripRepository);
export const createBranch = makeCreateBranch(branchRepository);
export const createVehicle = makeCreateVehicle(vehicleRepository);
export const createStaff = makeCreateStaff(staffRepository);
export const createTrip = makeCreateTrip(tripRepository);
export const changeCompanyStatus = makeChangeCompanyStatus(companyRepository);
