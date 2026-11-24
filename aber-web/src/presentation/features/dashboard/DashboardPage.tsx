import type { JSX } from 'react';
import { ROLE_LABEL } from '@/domain/entities/User';
import { Card } from '@/presentation/components/ui/Card';
import { useAuthStore } from '@/presentation/stores/authStore';

// Placeholder landing page. Role screens arrive in Phase 7.
export function DashboardPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  if (!user) return <></>;

  return (
    <Card variant="highlight">
      <h2 className="text-navy-900 text-[20px] font-bold">مرحبًا {user.fullName}</h2>
      <p className="mt-2 text-muted">
        تم تسجيل الدخول بنجاح بصفة <strong>{ROLE_LABEL[user.role]}</strong>.
      </p>
      <p className="mt-2 text-muted">شاشات هذا الدور تُضاف في المراحل القادمة.</p>
    </Card>
  );
}
