import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Shipment } from '@/domain/entities/Shipment';

const list = vi.fn();
vi.mock('@/app/container', () => ({
  shipmentRepository: { list: (...a: unknown[]) => list(...a) },
}));

const { ShipmentsPage } = await import('./ShipmentsPage');
const { useShipmentStore } = await import('@/presentation/stores/shipmentStore');

const item: Shipment = {
  id: 's1',
  trackingNumber: 'AB260000001',
  companyId: 'c',
  originBranchId: 'o',
  destBranchId: 'd',
  tripId: null,
  senderName: 'a',
  senderPhone: '1',
  receiverName: 'مستلم',
  receiverPhone: '2',
  goodsType: 'fragile',
  weightKg: 5,
  price: 15000,
  codAmount: 0,
  status: 'arrived',
  createdAt: '2026-11-24T10:00:00Z',
};

const renderPage = (): void => {
  render(
    <MemoryRouter>
      <ShipmentsPage />
    </MemoryRouter>,
  );
};

describe('ShipmentsPage', () => {
  afterEach(cleanup);
  beforeEach(() => {
    list.mockReset();
    useShipmentStore.setState({ items: [], loading: false, error: null });
  });

  it('shows rows with a status badge', async () => {
    list.mockResolvedValue([item]);
    renderPage();
    expect(await screen.findByText('AB260000001')).toBeTruthy();
    expect(screen.getAllByText('وصلت الفرع').length).toBeGreaterThan(0);
  });

  it('shows the empty state', async () => {
    list.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText('لا توجد شحنات')).toBeTruthy();
  });

  it('shows an error with a retry button', async () => {
    list.mockRejectedValue(new Error('تعذّر الاتصال بالخادم'));
    renderPage();
    expect(await screen.findByText('تعذّر الاتصال بالخادم')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).toBeTruthy();
  });
});
