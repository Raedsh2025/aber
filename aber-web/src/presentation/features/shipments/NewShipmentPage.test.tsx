import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/domain/entities/User';

const estimate = vi.fn();
const create = vi.fn();
vi.mock('@/app/container', () => ({
  authRepository: {},
  estimateRepository: { estimate: (...a: unknown[]) => estimate(...a) },
  branchRepository: {
    list: () =>
      Promise.resolve([
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'فرع حلب',
          governorateCode: 'ALP',
          governorateName: 'حلب',
          address: null,
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'فرع دمشق',
          governorateCode: 'DAM',
          governorateName: 'دمشق',
          address: null,
        },
      ]),
  },
  createShipment: (...a: unknown[]) => create(...a),
}));

const { NewShipmentPage } = await import('./NewShipmentPage');
const { useAuthStore } = await import('@/presentation/stores/authStore');

const admin: User = {
  id: 'u',
  fullName: 'مدير',
  email: 'a@example.test',
  phone: null,
  role: 'company_admin',
  companyId: 'c',
  branchId: null,
};

const renderPage = (): void => {
  render(
    <MemoryRouter>
      <NewShipmentPage />
    </MemoryRouter>,
  );
};

beforeEach(() => useAuthStore.setState({ user: admin }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('NewShipmentPage', () => {
  it('shows Arabic validation errors and does not create anything', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('إنشاء الشحنة'));
    expect(await screen.findByText('اختر فرع الانطلاق')).toBeTruthy();
    expect(screen.getAllByText('رقم هاتف غير صالح').length).toBe(2);
    expect(create).not.toHaveBeenCalled();
  });

  it('shows a live price from the server once route and weight are filled', async () => {
    estimate.mockResolvedValue({ from: 'ALP', to: 'DAM', price: 25_000, estHours: 6 });
    renderPage();
    await screen.findByText('إنشاء الشحنة');
    fireEvent.change(screen.getByLabelText('فرع الانطلاق'), {
      target: { value: '11111111-1111-4111-8111-111111111111' },
    });
    fireEvent.change(screen.getByLabelText('فرع الوجهة'), {
      target: { value: '22222222-2222-4222-8222-222222222222' },
    });
    fireEvent.change(screen.getByLabelText('الوزن (كغ)'), { target: { value: '10' } });
    expect(await screen.findByText('25000', {}, { timeout: 3000 })).toBeTruthy();
    expect(estimate).toHaveBeenCalledWith({
      from: 'ALP',
      to: 'DAM',
      weightKg: 10,
      goodsType: 'normal',
    });
  });

  it('shows no preview before the form has a route', async () => {
    renderPage();
    await screen.findByText('إنشاء الشحنة');
    expect(estimate).not.toHaveBeenCalled();
    expect(screen.queryByText(/السعر المتوقع/)).toBeNull();
  });
});
