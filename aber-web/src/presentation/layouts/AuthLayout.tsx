import type { JSX } from 'react';
import { Outlet } from 'react-router-dom';

export function AuthLayout(): JSX.Element {
  return (
    <main className="min-h-screen bg-tint flex flex-col items-center justify-center gap-6 p-6">
      <header className="text-center">
        <h1 className="text-navy-900 text-[32px] font-extrabold">عابر</h1>
        <p className="text-muted">منصة إدارة عمليات الشحن بين المحافظات السورية</p>
      </header>
      <Outlet />
    </main>
  );
}
