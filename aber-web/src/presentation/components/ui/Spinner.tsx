import type { JSX } from 'react';

export function Spinner({ label = 'جارٍ التحميل...' }: { label?: string }): JSX.Element {
  return (
    <div role="status" className="flex items-center justify-center gap-3 p-6 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-navy-900" />
      <span>{label}</span>
    </div>
  );
}
