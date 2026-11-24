import clsx from 'clsx';
import type { JSX } from 'react';

interface LogoProps {
  tone?: 'light' | 'dark';
  size?: 'md' | 'lg';
  className?: string;
}

// Brand mark: a route curve between two stops, inside a gold-framed tile.
export function Logo({ tone = 'dark', size = 'md', className }: LogoProps): JSX.Element {
  const isLarge = size === 'lg';
  return (
    <span className={clsx('inline-flex items-center gap-3', className)}>
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className={clsx(isLarge ? 'h-14 w-14' : 'h-10 w-10')}
      >
        <rect width="48" height="48" rx="14" className="fill-gold-500" />
        <rect x="3" y="3" width="42" height="42" rx="11" className="fill-navy-900" />
        <path
          d="M12 32c6-14 18-14 24-14"
          className="stroke-gold-500"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="12" cy="32" r="3.5" className="fill-white" />
        <path
          d="M33 12l6 6-6 6"
          className="stroke-white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span
        className={clsx(
          'font-extrabold leading-none',
          isLarge ? 'text-[32px]' : 'text-[22px]',
          tone === 'light' ? 'text-white' : 'text-navy-900',
        )}
      >
        عابر
      </span>
    </span>
  );
}
