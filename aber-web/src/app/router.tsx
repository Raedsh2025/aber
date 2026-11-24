import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/presentation/components/shared/ProtectedRoute';
import { LoginPage } from '@/presentation/features/auth/LoginPage';
import { DashboardPage } from '@/presentation/features/dashboard/DashboardPage';
import { ForbiddenPage } from '@/presentation/features/errors/ForbiddenPage';
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
            element: <ProtectedRoute roles={['branch_staff', 'company_admin']} />,
            children: [
              { path: '/branch/shipments', element: <ShipmentsPage /> },
              { path: '/branch/shipments/new', element: <NewShipmentPage /> },
              { path: '/branch/shipments/:trackingNumber', element: <ShipmentDetailPage /> },
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
