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
  primary: 'bg-navy-900 text-white hover:bg-navy-700',
  secondary: 'border border-navy-900 text-navy-900 hover:bg-tint',
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
        'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
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
