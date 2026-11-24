import clsx from 'clsx';
import type { HTMLAttributes, JSX } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight';
  interactive?: boolean;
  flush?: boolean; // No inner padding, for tables and lists that reach the card edge.
}

export function Card({
  variant = 'default',
  interactive,
  flush,
  className,
  ...rest
}: CardProps): JSX.Element {
  return (
    <div
      className={clsx(
        'animate-rise rounded-xl border border-line/80 bg-surface shadow-card',
        flush ? 'overflow-hidden' : 'p-5 sm:p-6',
        variant === 'highlight' && 'border-t-4 border-t-gold-500',
        interactive && 'transition duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
      {...rest}
    />
  );
}
