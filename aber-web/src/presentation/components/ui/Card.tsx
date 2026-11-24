import clsx from 'clsx';
import type { HTMLAttributes, JSX } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight';
  interactive?: boolean;
}

export function Card({
  variant = 'default',
  interactive,
  className,
  ...rest
}: CardProps): JSX.Element {
  return (
    <div
      className={clsx(
        'animate-rise rounded-xl border border-line/80 bg-surface p-5 shadow-card sm:p-6',
        variant === 'highlight' && 'border-t-4 border-t-gold-500',
        interactive && 'transition duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
      {...rest}
    />
  );
}
