import clsx from 'clsx';
import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, children, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-semibold text-navy-900">
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        className={clsx(
          'h-11 rounded-md border bg-surface px-3 text-ink',
          'focus:border-gold-500 focus:outline-2 focus:outline-gold-500/40',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
