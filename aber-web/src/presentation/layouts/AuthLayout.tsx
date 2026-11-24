import type { JSX } from 'react';
import { Outlet } from 'react-router-dom';
import { Logo } from '@/presentation/components/shared/Logo';

const HIGHLIGHTS = ['تتبّع لحظي للشحنات', 'مانيفست ورحلات منظّمة', 'تحصيل عند التسليم بأمان'];

export function AuthLayout(): JSX.Element {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="bg-brand relative flex flex-col justify-between gap-10 overflow-hidden p-8 text-white lg:p-14">
        <span
          aria-hidden="true"
          className="animate-float absolute -bottom-24 -end-24 h-72 w-72 rounded-full border-[28px] border-gold-500/25"
        />
        <Logo tone="light" size="lg" />
        <div className="relative max-w-md">
          <h1 className="text-[32px] leading-snug font-extrabold">
            شحنك بين المحافظات، <span className="text-gold-grad">تحت السيطرة</span>
          </h1>
          <p className="mt-3 text-white/80">منصة إدارة عمليات الشحن بين المحافظات السورية</p>
          <ul className="mt-6 hidden flex-col gap-2 sm:flex">
            {HIGHLIGHTS.map((text) => (
              <li key={text} className="flex items-center gap-2 text-white/90">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold-500" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="bg-page flex items-center justify-center p-6">
        <Outlet />
      </section>
    </main>
  );
}
