import clsx from 'clsx';
import type { HTMLAttributes, JSX } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight';
}

export function Card({ variant = 'default', className, ...rest }: CardProps): JSX.Element {
  return (
    <div
      className={clsx(
        'rounded-lg border border-line bg-surface p-6 shadow-sm',
        variant === 'highlight' && 'border-s-4 border-s-gold-500',
        className,
      )}
      {...rest}
    />
  );
}
