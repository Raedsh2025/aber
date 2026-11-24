export type Role = 'system_admin' | 'company_admin' | 'branch_staff' | 'line_driver' | 'customer';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  companyId: string | null;
  branchId: string | null;
}

export const ROLE_LABEL: Record<Role, string> = {
  system_admin: 'مدير النظام',
  company_admin: 'مدير الشركة',
  branch_staff: 'موظف الفرع',
  line_driver: 'سائق الخط',
  customer: 'عميل',
};
