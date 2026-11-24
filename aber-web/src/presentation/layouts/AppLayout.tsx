import type { JSX } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ROLE_LABEL } from '@/domain/entities/User';
import { Button } from '@/presentation/components/ui/Button';
import { useAuthStore } from '@/presentation/stores/authStore';

export function AppLayout(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-tint">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="text-xl font-extrabold">عابر</span>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm">
                {user.fullName}
                <span className="ms-2 rounded-full bg-gold-500/20 px-3 py-0.5 text-gold-100">
                  {ROLE_LABEL[user.role]}
                </span>
              </span>
              <Button variant="secondary" size="sm" className="bg-white" onClick={logout}>
                تسجيل الخروج
              </Button>
            </div>
          )}
        </div>
      </header>
      {user && (user.role === 'branch_staff' || user.role === 'company_admin') && (
        <nav className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-5xl gap-4 px-4">
            <NavLink
              to="/branch/shipments"
              className="inline-flex min-h-11 items-center font-semibold text-navy-900"
            >
              الشحنات
            </NavLink>
          </div>
        </nav>
      )}
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
