import type { JSX } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@/domain/entities/User';
import { useAuthStore } from '@/presentation/stores/authStore';

export function ProtectedRoute({ roles }: { roles?: Role[] }): JSX.Element {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/403" replace />;
  return <Outlet />;
}
