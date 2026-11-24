import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/presentation/features/auth/LoginPage';
import { DashboardPage } from '@/presentation/features/dashboard/DashboardPage';
import { ForbiddenPage } from '@/presentation/features/errors/ForbiddenPage';
import { ProtectedRoute } from '@/presentation/components/shared/ProtectedRoute';
import { AppLayout } from '@/presentation/layouts/AppLayout';
import { AuthLayout } from '@/presentation/layouts/AuthLayout';
import type { RouteObject } from 'react-router-dom';

// Role-specific routes (branch, driver, admin) are added with their screens in Phase 7.
export const routes: RouteObject[] = [
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { element: <AuthLayout />, children: [{ path: '/login', element: <LoginPage /> }] },
  {
    element: <ProtectedRoute />,
    children: [
      { element: <AppLayout />, children: [{ path: '/dashboard', element: <DashboardPage /> }] },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
];

export const router = createBrowserRouter(routes);
