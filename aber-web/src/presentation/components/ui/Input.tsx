import clsx from 'clsx';
import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="font-semibold text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={clsx(
          'h-11 rounded-md border bg-surface px-3 text-ink',
          'focus:outline-2 focus:outline-navy-700',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={messageId} role="alert" className="text-small text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
