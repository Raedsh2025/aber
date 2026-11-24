import clsx from 'clsx';
import type { ButtonHTMLAttributes, JSX } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-navy-700 to-navy-900 text-white shadow-card hover:shadow-lift hover:brightness-110',
  secondary:
    'border border-navy-900/30 bg-surface text-navy-900 hover:border-navy-900 hover:bg-tint',
  ghost: 'text-navy-900 hover:bg-tint',
  danger: 'bg-danger text-white hover:opacity-90',
};

// Every size keeps a touch target of at least 44px (h-11 = 44px).
const sizes: Record<Size, string> = {
  sm: 'h-11 px-3 text-sm',
  md: 'h-11 px-5',
  lg: 'h-12 px-6 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold',
        'transition duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? 'جارٍ التنفيذ...' : children}
    </button>
  );
}
