import { createApp } from './app';
import { env } from './config/env';
import { pool, withTransaction } from './db/pool';
import { createAuthRepository } from './modules/auth/auth.repository';
import { createAuthRouter } from './modules/auth/auth.routes';
import { createAuthService } from './modules/auth/auth.service';
import { createAuthenticate } from './middlewares/authenticate';
import { createShipmentRepository } from './modules/shipments/shipment.repository';
import { createShipmentRouters } from './modules/shipments/shipment.routes';
import { createBranchRepository } from './modules/branches/branch.repository';
import { createBranchRouter } from './modules/branches/branch.routes';
import { createBranchService } from './modules/branches/branch.service';
import { createTripRepository } from './modules/trips/trip.repository';
import { createTripRouter } from './modules/trips/trip.routes';
import { createTripService } from './modules/trips/trip.service';
import { createStaffRepository } from './modules/staff/staff.repository';
import { createStaffRouter } from './modules/staff/staff.routes';
import { createStaffService } from './modules/staff/staff.service';
import { createCompanyRepository } from './modules/companies/company.repository';
import { createCompanyRouter } from './modules/companies/company.routes';
import { createCompanyService } from './modules/companies/company.service';
import { createVehicleRepository } from './modules/vehicles/vehicle.repository';
import { createVehicleRouter } from './modules/vehicles/vehicle.routes';
import { createVehicleService } from './modules/vehicles/vehicle.service';
import { createShipmentService } from './modules/shipments/shipment.service';

// Composition root: the only place where real implementations are wired together.
const authService = createAuthService(createAuthRepository(pool), {
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
});

const shipmentService = createShipmentService(createShipmentRepository(pool), (work) =>
  withTransaction((client) => work(createShipmentRepository(client))),
);
const { shipmentRouter, publicRouter } = createShipmentRouters(
  shipmentService,
  createAuthenticate(env.JWT_SECRET),
);

const tripService = createTripService(
  { trips: createTripRepository(pool), shipments: createShipmentRepository(pool) },
  (work) =>
    withTransaction((client) =>
      work({ trips: createTripRepository(client), shipments: createShipmentRepository(client) }),
    ),
);
const tripRouter = createTripRouter(tripService, createAuthenticate(env.JWT_SECRET));

const branchRouter = createBranchRouter(
  createBranchService(createBranchRepository(pool)),
  createAuthenticate(env.JWT_SECRET),
);

const vehicleRouter = createVehicleRouter(
  createVehicleService(createVehicleRepository(pool)),
  createAuthenticate(env.JWT_SECRET),
);
const staffRouter = createStaffRouter(
  createStaffService(createStaffRepository(pool)),
  createAuthenticate(env.JWT_SECRET),
);

const companyRouter = createCompanyRouter(
  createCompanyService(createCompanyRepository(pool)),
  createAuthenticate(env.JWT_SECRET),
);

createApp(
  { corsOrigin: env.CORS_ORIGIN, isTest: env.NODE_ENV === 'test' },
  {
    authRouter: createAuthRouter(authService),
    publicRouter,
    shipmentRouter,
    tripRouter,
    branchRouter,
    vehicleRouter,
    staffRouter,
    companyRouter,
  },
).listen(env.PORT, () => {
  console.log(`aber-api listening on port ${env.PORT}`);
});
