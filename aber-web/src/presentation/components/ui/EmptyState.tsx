import type { JSX, ReactNode } from 'react';

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <p className="font-bold text-navy-900">{title}</p>
      {children && <div className="text-muted">{children}</div>}
    </div>
  );
}
