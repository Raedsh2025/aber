import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/domain/entities/User';
import { AccountPage } from './AccountPage';

const listMock = vi.fn();
vi.mock('@/app/container', () => ({
  accountRepository: { listMyShipments: () => listMock() },
}));

const { useAuthStore } = await import('@/presentation/stores/authStore');

const customer: User = {
  id: 'c1',
  fullName: 'زبون',
  email: 'c@example.test',
  phone: '911222333',
  role: 'customer',
  companyId: null,
  branchId: null,
};

function renderPage(): void {
  useAuthStore.setState({ user: customer });
  render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>,
  );
}

describe('AccountPage', () => {
  afterEach(cleanup);

  beforeEach(() => {
    listMock.mockReset();
    localStorage.clear();
    useAuthStore.setState({ user: null });
  });

  it('lists the customer shipments with their Arabic status', async () => {
    listMock.mockResolvedValue([
      {
        trackingNumber: 'ABR-1',
        status: 'in_transit',
        originGovernorate: 'حلب',
        destGovernorate: 'دمشق',
        createdAt: '2026-11-20T10:00:00.000Z',
      },
    ]);
    renderPage();
    expect(await screen.findByText('ABR-1')).toBeTruthy();
    expect(screen.getByText('في الطريق')).toBeTruthy();
    expect(screen.getByText('زبون')).toBeTruthy();
  });

  it('shows an empty state when there are no shipments', async () => {
    listMock.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText('لا توجد شحنات على رقمك بعد')).toBeTruthy();
  });

  it('shows the error state when loading fails', async () => {
    listMock.mockRejectedValue(new Error('تعذّر الاتصال بالخادم'));
    renderPage();
    await waitFor(() => expect(screen.getByText('تعذّر الاتصال بالخادم')).toBeTruthy());
  });
});
