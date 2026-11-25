import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/domain/entities/User';

const branchDaily = vi.fn();
const getByTracking = vi.fn();
vi.mock('@/app/container', () => ({
  authRepository: {},
  reportRepository: { branchDaily: (...a: unknown[]) => branchDaily(...a) },
  shipmentRepository: { getByTrackingNumber: (...a: unknown[]) => getByTracking(...a) },
  branchRepository: {
    list: () =>
      Promise.resolve([
        {
          id: 'b1',
          name: 'فرع حلب',
          governorateCode: 'ALP',
          governorateName: 'حلب',
          address: null,
        },
      ]),
  },
}));

const { BranchDailyReportPage } = await import('./BranchDailyReportPage');
const { ShipmentLabelPage } = await import('../shipments/ShipmentLabelPage');
const { useAuthStore } = await import('@/presentation/stores/authStore');

const user = (role: User['role']): User => ({
  id: 'u',
  fullName: 'اختبار',
  email: 'a@example.test',
  phone: null,
  role,
  companyId: 'c',
  branchId: null,
});

const report = {
  date: '2026-11-25',
  branchId: 'b1',
  branchName: 'فرع حلب',
  shipmentsCount: 3,
  totalWeightKg: 40,
  totalPrice: 90000,
  totalCod: 5000,
  byStatus: { received: 3 },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('BranchDailyReportPage', () => {
  it('loads the own-branch report for branch staff without choosing a branch', async () => {
    useAuthStore.setState({ user: user('branch_staff') });
    branchDaily.mockResolvedValue(report);
    render(<BranchDailyReportPage />);
    expect(await screen.findByText('90,000')).toBeTruthy();
    expect(branchDaily).toHaveBeenCalledWith({ date: undefined, branchId: undefined });
    expect(screen.queryByText('اختر فرعًا لعرض تقريره')).toBeNull();
  });

  it('asks a company admin to choose a branch, then loads it', async () => {
    useAuthStore.setState({ user: user('company_admin') });
    branchDaily.mockResolvedValue(report);
    render(<BranchDailyReportPage />);
    expect(await screen.findByText('اختر فرعًا لعرض تقريره')).toBeTruthy();
    expect(branchDaily).not.toHaveBeenCalled();
    await screen.findByText('فرع حلب');
    fireEvent.change(screen.getByLabelText('الفرع'), { target: { value: 'b1' } });
    await waitFor(() =>
      expect(branchDaily).toHaveBeenCalledWith({ date: undefined, branchId: 'b1' }),
    );
  });

  it('shows an empty state for a day without shipments and an error with retry', async () => {
    useAuthStore.setState({ user: user('branch_staff') });
    branchDaily.mockResolvedValueOnce({ ...report, shipmentsCount: 0, byStatus: {} });
    render(<BranchDailyReportPage />);
    expect(await screen.findByText('لا توجد شحنات في هذا اليوم')).toBeTruthy();
    cleanup();
    branchDaily.mockRejectedValueOnce(new Error('تعذّر تحميل التقرير'));
    render(<BranchDailyReportPage />);
    expect(await screen.findByText('تعذّر تحميل التقرير')).toBeTruthy();
  });
});

describe('ShipmentLabelPage', () => {
  const renderLabel = (): void => {
    render(
      <MemoryRouter initialEntries={['/branch/shipments/AB260000001/label']}>
        <Routes>
          <Route path="/branch/shipments/:trackingNumber/label" element={<ShipmentLabelPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('shows the tracking number and receiver on the label', async () => {
    getByTracking.mockResolvedValue({
      trackingNumber: 'AB260000001',
      receiverName: 'مستلم',
      receiverPhone: '0944000000',
      goodsType: 'normal',
      weightKg: 5,
      codAmount: 0,
    });
    renderLabel();
    expect(await screen.findByText('AB260000001')).toBeTruthy();
    expect(screen.getByText('مستلم')).toBeTruthy();
    expect(getByTracking).toHaveBeenCalledWith('AB260000001');
  });

  it('shows an error when the shipment cannot be loaded', async () => {
    getByTracking.mockRejectedValue(new Error('الشحنة غير موجودة'));
    renderLabel();
    expect(await screen.findByText('الشحنة غير موجودة')).toBeTruthy();
  });
});
