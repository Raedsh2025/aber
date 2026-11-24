import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/presentation/components/ui/Card';

export function ForbiddenPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-tint flex items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <h1 className="text-danger text-[26px] font-extrabold">403</h1>
        <p className="mt-2">لا تملك صلاحية الوصول إلى هذه الصفحة.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-navy-700 underline">
          العودة إلى الصفحة الرئيسية
        </Link>
      </Card>
    </main>
  );
}
