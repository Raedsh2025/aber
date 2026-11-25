import type { JSX } from 'react';
import { changeCompanyStatus, companyRepository } from '@/app/container';
import type { Company, CompanyStatus } from '@/domain/entities/Company';
import { ListState } from '@/presentation/features/admin/ListState';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { CompanyStatusBadge } from '@/presentation/components/ui/CompanyStatusBadge';
import { useRemoteList } from '@/presentation/hooks/useRemoteList';
import { useSubmit } from '@/presentation/hooks/useSubmit';

const loadCompanies = () => companyRepository.list();

interface Action {
  status: CompanyStatus;
  label: string;
  variant: 'primary' | 'secondary';
}

const actionsFor = (status: CompanyStatus): Action[] =>
  status === 'approved'
    ? [{ status: 'suspended', label: 'إيقاف', variant: 'secondary' }]
    : [
        {
          status: 'approved',
          label: status === 'pending' ? 'اعتماد' : 'إعادة تفعيل',
          variant: 'primary',
        },
      ];

function CompanyRow({ company, onDone }: { company: Company; onDone: () => void }): JSX.Element {
  const change = useSubmit(changeCompanyStatus, 'تم تحديث حالة الشركة', onDone);
  return (
    <Card interactive className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-bold text-navy-900">{company.name}</p>
        {company.phone && (
          <p dir="ltr" className="text-start text-small text-muted">
            {company.phone}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <CompanyStatusBadge status={company.status} />
        {actionsFor(company.status).map((a) => (
          <Button
            key={a.status}
            size="sm"
            variant={a.variant}
            loading={change.loading}
            onClick={() => void change.run(company, a.status).catch(() => undefined)}
          >
            {a.label}
          </Button>
        ))}
      </div>
      {change.error && (
        <p role="alert" className="w-full rounded-md bg-danger/10 px-3 py-2 text-danger">
          {change.error}
        </p>
      )}
    </Card>
  );
}

export function CompaniesPage(): JSX.Element {
  const { items, loading, error, refresh } = useRemoteList(loadCompanies, 'تعذّر تحميل الشركات');
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[20px] font-bold text-navy-900">الشركات</h2>
      <ListState
        loading={loading}
        error={error}
        isEmpty={items.length === 0}
        emptyTitle="لا توجد شركات بعد"
        onRetry={refresh}
      >
        <div className="flex flex-col gap-3">
          {items.map((c) => (
            <CompanyRow key={c.id} company={c} onDone={refresh} />
          ))}
        </div>
      </ListState>
    </div>
  );
}
