import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Company } from '@/domain/entities/Company';

const listCompanies = vi.fn();
const changeStatus = vi.fn();
const platform = vi.fn();
vi.mock('@/app/container', () => ({
  companyRepository: { list: () => listCompanies() },
  changeCompanyStatus: (...a: unknown[]) => changeStatus(...a),
  statsRepository: { platform: () => platform() },
}));

const { CompaniesPage } = await import('./CompaniesPage');
const { SystemStatsPage } = await import('./SystemStatsPage');

const company = (id: string, name: string, status: Company['status']): Company => ({
  id,
  name,
  phone: null,
  status,
  createdAt: '2026-01-01T00:00:00Z',
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CompaniesPage', () => {
  it('offers the right action for each status', async () => {
    listCompanies.mockResolvedValue([
      company('1', 'شركة أ', 'pending'),
      company('2', 'شركة ب', 'approved'),
      company('3', 'شركة ج', 'suspended'),
    ]);
    render(<CompaniesPage />);
    expect(await screen.findByText('اعتماد')).toBeTruthy();
    expect(screen.getByText('إيقاف')).toBeTruthy();
    expect(screen.getByText('إعادة تفعيل')).toBeTruthy();
  });

  it('approves a pending company and reloads the list', async () => {
    const pending = company('1', 'شركة أ', 'pending');
    listCompanies.mockResolvedValue([pending]);
    changeStatus.mockResolvedValue({ ...pending, status: 'approved' });
    render(<CompaniesPage />);
    fireEvent.click(await screen.findByText('اعتماد'));
    await vi.waitFor(() => expect(changeStatus).toHaveBeenCalledWith(pending, 'approved'));
    await vi.waitFor(() => expect(listCompanies).toHaveBeenCalledTimes(2));
  });

  it('shows empty and error states', async () => {
    listCompanies.mockResolvedValueOnce([]);
    render(<CompaniesPage />);
    expect(await screen.findByText('لا توجد شركات بعد')).toBeTruthy();
    cleanup();
    listCompanies.mockRejectedValueOnce(new Error('تعذّر تحميل الشركات'));
    render(<CompaniesPage />);
    expect(await screen.findByText('تعذّر تحميل الشركات')).toBeTruthy();
    expect(screen.getByText('إعادة المحاولة')).toBeTruthy();
  });
});

describe('SystemStatsPage', () => {
  it('shows the platform numbers', async () => {
    platform.mockResolvedValue({
      companies: { approved: 2, pending: 1 },
      users: 9,
      trips: 4,
      shipmentsTotal: 6,
      shipmentsByStatus: { received: 6 },
      totalRevenue: 12000,
    });
    render(<SystemStatsPage />);
    expect(await screen.findByText('إحصاءات المنصة')).toBeTruthy();
    expect(screen.getByText('12,000')).toBeTruthy();
    expect(screen.getByText('مستلمة')).toBeTruthy();
  });

  it('shows an error with retry', async () => {
    platform.mockRejectedValue(new Error('تعذّر تحميل الإحصاءات'));
    render(<SystemStatsPage />);
    expect(await screen.findByText('تعذّر تحميل الإحصاءات')).toBeTruthy();
    expect(screen.getByText('إعادة المحاولة')).toBeTruthy();
  });
});
