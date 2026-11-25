import clsx from 'clsx';
import type { JSX } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ROLE_LABEL } from '@/domain/entities/User';
import { landingPathFor } from '@/domain/services/landingPath';
import { Logo } from '@/presentation/components/shared/Logo';
import { Button } from '@/presentation/components/ui/Button';
import { useAuthStore } from '@/presentation/stores/authStore';

const navClass = ({ isActive }: { isActive: boolean }): string =>
  clsx(
    'inline-flex min-h-11 items-center rounded-md px-4 font-semibold transition',
    isActive ? 'bg-navy-900 text-white shadow-card' : 'text-navy-900 hover:bg-navy-900/5',
  );

const ADMIN_LINKS = [
  { to: '/admin/trips', label: 'الرحلات' },
  { to: '/admin/branches', label: 'الفروع' },
  { to: '/admin/staff', label: 'الموظفون' },
  { to: '/admin/vehicles', label: 'المركبات' },
];

export function AppLayout(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hasShipments = user?.role === 'branch_staff' || user?.role === 'company_admin';

  return (
    <div className="bg-page min-h-screen">
      <header className="no-print bg-brand sticky top-0 z-10 text-white shadow-lift">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <NavLink to={user ? landingPathFor(user.role) : '/'} aria-label="الرئيسية">
            <Logo tone="light" />
          </NavLink>
          {user && (
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 font-extrabold text-navy-900"
              >
                {user.fullName.charAt(0)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="font-semibold">{user.fullName}</p>
                <p className="text-small text-gold-100/80">{ROLE_LABEL[user.role]}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={logout}>
                خروج
              </Button>
            </div>
          )}
        </div>
      </header>
      <nav
        aria-label="التنقل الرئيسي"
        className="no-print border-b border-line bg-surface/80 backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2">
          <NavLink to={user ? landingPathFor(user.role) : '/'} className={navClass}>
            الرئيسية
          </NavLink>
          {user?.role === 'company_admin' &&
            ADMIN_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>
                {link.label}
              </NavLink>
            ))}
          {user?.role === 'system_admin' && (
            <NavLink to="/system/stats" className={navClass}>
              الإحصاءات
            </NavLink>
          )}
          {user?.role === 'system_admin' && (
            <NavLink to="/system/companies" className={navClass}>
              الشركات
            </NavLink>
          )}
          {user?.role === 'line_driver' && (
            <NavLink to="/driver/trips" className={navClass}>
              رحلاتي
            </NavLink>
          )}
          {hasShipments && (
            <NavLink to="/branch/shipments" className={navClass}>
              الشحنات
            </NavLink>
          )}
          {hasShipments && (
            <NavLink to="/branch/report" className={navClass}>
              التقرير اليومي
            </NavLink>
          )}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
