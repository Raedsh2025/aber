export type CompanyStatus = 'pending' | 'approved' | 'suspended';

export const COMPANY_STATUS_LABEL: Record<CompanyStatus, string> = {
  pending: 'بانتظار الاعتماد',
  approved: 'معتمدة',
  suspended: 'موقوفة',
};

export interface Company {
  id: string;
  name: string;
  phone: string | null;
  status: CompanyStatus;
  createdAt: string;
}
