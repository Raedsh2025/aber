import type { JSX } from 'react';

export function App(): JSX.Element {
  return (
    <main className="min-h-screen bg-tint flex items-center justify-center p-6">
      <section className="bg-surface border border-line border-s-4 border-s-gold-500 rounded-lg shadow-sm p-8 max-w-md w-full text-start">
        <h1 className="text-navy-900 text-[26px] font-extrabold">مرحبًا بك في عابر</h1>
        <p className="text-muted mt-2">منصة إدارة عمليات الشحن بين المحافظات السورية.</p>
        <p className="text-gold-500 font-bold mt-4">المرحلة 1: التأسيس</p>
      </section>
    </main>
  );
}
