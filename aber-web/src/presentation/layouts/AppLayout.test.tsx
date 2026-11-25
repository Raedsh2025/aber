import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/domain/entities/User';

vi.mock('@/app/container', () => ({ authRepository: {} }));

const { AppLayout } = await import('./AppLayout');
const { useAuthStore } = await import('@/presentation/stores/authStore');

const asRole = (role: User['role']): void => {
  useAuthStore.setState({
    user: {
      id: 'u',
      fullName: 'اختبار',
      email: 'a@example.test',
      role,
      companyId: 'c',
      branchId: null,
    },
  });
  render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>,
  );
};

const has = (text: string): boolean => screen.queryByRole('link', { name: text }) !== null;

afterEach(cleanup);

describe('AppLayout navigation by role', () => {
  it('shows company admin links only to a company admin', () => {
    asRole('company_admin');
    expect(has('الفروع')).toBe(true);
    expect(has('المركبات')).toBe(true);
    expect(has('الشحنات')).toBe(true);
    expect(has('الشركات')).toBe(false);
  });

  it('shows platform links only to a system admin', () => {
    asRole('system_admin');
    expect(has('الشركات')).toBe(true);
    expect(has('الإحصاءات')).toBe(true);
    expect(has('الفروع')).toBe(false);
    expect(has('الشحنات')).toBe(false);
  });

  it('shows only the driver trips link to a line driver', () => {
    asRole('line_driver');
    expect(has('رحلاتي')).toBe(true);
    expect(has('الشحنات')).toBe(false);
    expect(has('الفروع')).toBe(false);
  });

  it('shows shipments and the daily report to branch staff', () => {
    asRole('branch_staff');
    expect(has('الشحنات')).toBe(true);
    expect(has('التقرير اليومي')).toBe(true);
    expect(has('الشركات')).toBe(false);
  });
});
