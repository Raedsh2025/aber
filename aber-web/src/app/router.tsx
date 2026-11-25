import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/presentation/components/shared/ProtectedRoute';
import { LoginPage } from '@/presentation/features/auth/LoginPage';
import { DashboardPage } from '@/presentation/features/dashboard/DashboardPage';
import { ForbiddenPage } from '@/presentation/features/errors/ForbiddenPage';
import { AdminTripsPage } from '@/presentation/features/admin/AdminTripsPage';
import { BranchesPage } from '@/presentation/features/admin/BranchesPage';
import { StaffPage } from '@/presentation/features/admin/StaffPage';
import { VehiclesPage } from '@/presentation/features/admin/VehiclesPage';
import { CompaniesPage } from '@/presentation/features/system/CompaniesPage';
import { BranchDailyReportPage } from '@/presentation/features/reports/BranchDailyReportPage';
import { ShipmentLabelPage } from '@/presentation/features/shipments/ShipmentLabelPage';
import { DriverTripsPage } from '@/presentation/features/trips/DriverTripsPage';
import { TripManifestPage } from '@/presentation/features/trips/TripManifestPage';
import { NewShipmentPage } from '@/presentation/features/shipments/NewShipmentPage';
import { ShipmentDetailPage } from '@/presentation/features/shipments/ShipmentDetailPage';
import { ShipmentsPage } from '@/presentation/features/shipments/ShipmentsPage';
import { TrackPage } from '@/presentation/features/tracking/TrackPage';
import { AppLayout } from '@/presentation/layouts/AppLayout';
import { AuthLayout } from '@/presentation/layouts/AuthLayout';

// Driver, company admin and system admin screens are added in the next Phase 7 PRs.
export const routes: RouteObject[] = [
  { path: '/', element: <TrackPage /> }, // Public tracking, no login.
  { element: <AuthLayout />, children: [{ path: '/login', element: <LoginPage /> }] },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          {
            element: <ProtectedRoute roles={['company_admin']} />,
            children: [
              { path: '/admin/branches', element: <BranchesPage /> },
              { path: '/admin/staff', element: <StaffPage /> },
              { path: '/admin/vehicles', element: <VehiclesPage /> },
              { path: '/admin/trips', element: <AdminTripsPage /> },
            ],
          },
          {
            element: <ProtectedRoute roles={['system_admin']} />,
            children: [{ path: '/system/companies', element: <CompaniesPage /> }],
          },
          {
            element: <ProtectedRoute roles={['line_driver']} />,
            children: [
              { path: '/driver/trips', element: <DriverTripsPage /> },
              { path: '/driver/trips/:tripId', element: <TripManifestPage /> },
            ],
          },
          {
            element: <ProtectedRoute roles={['branch_staff', 'company_admin']} />,
            children: [
              { path: '/branch/shipments', element: <ShipmentsPage /> },
              { path: '/branch/shipments/new', element: <NewShipmentPage /> },
              { path: '/branch/shipments/:trackingNumber', element: <ShipmentDetailPage /> },
              { path: '/branch/shipments/:trackingNumber/label', element: <ShipmentLabelPage /> },
              { path: '/branch/report', element: <BranchDailyReportPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
];

export const router = createBrowserRouter(routes);
