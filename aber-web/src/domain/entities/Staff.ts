export type StaffRole = 'branch_staff' | 'line_driver';

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  branch_staff: 'موظف فرع',
  line_driver: 'سائق',
};

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: StaffRole;
  branchId: string | null;
  isActive: boolean;
}
