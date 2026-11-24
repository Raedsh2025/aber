import clsx from 'clsx';
import type { JSX, ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: 'navy' | 'gold' | 'success' | 'warning';
}

const accents = {
  navy: 'bg-navy-900/10 text-navy-900',
  gold: 'bg-gold-500/15 text-gold-500',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
};

export function StatCard({ label, value, icon, accent = 'navy' }: StatCardProps): JSX.Element {
  return (
    <div className="animate-rise flex items-center gap-4 rounded-xl border border-line/80 bg-surface p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <span
        aria-hidden="true"
        className={clsx(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
          accents[accent],
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-small text-muted">{label}</p>
        <p dir="ltr" className="text-start text-[26px] leading-tight font-extrabold text-navy-900">
          {value}
        </p>
      </div>
    </div>
  );
}
