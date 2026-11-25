import clsx from 'clsx';
import type { JSX } from 'react';
import { COMPANY_STATUS_LABEL, type CompanyStatus } from '@/domain/entities/Company';

const tone: Record<CompanyStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  suspended: 'bg-danger/10 text-danger',
};

export function CompanyStatusBadge({ status }: { status: CompanyStatus }): JSX.Element {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-semibold',
        tone[status],
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {COMPANY_STATUS_LABEL[status]}
    </span>
  );
}
