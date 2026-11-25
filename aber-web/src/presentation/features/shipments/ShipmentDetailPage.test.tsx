import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Shipment, ShipmentStatus } from '@/domain/entities/Shipment';

const getByTracking = vi.fn();
vi.mock('@/app/container', () => ({
  advanceShipmentStatus: vi.fn(),
  deliverShipment: vi.fn(),
  shipmentRepository: {
    getByTrackingNumber: (...a: unknown[]) => getByTracking(...a),
    trackPublic: () =>
      Promise.resolve({
        trackingNumber: 'AB260000001',
        status: 'received',
        originGovernorate: 'حلب',
        destGovernorate: 'دمشق',
        history: [],
      }),
  },
}));

const { ShipmentDetailPage } = await import('./ShipmentDetailPage');

const shipment = (status: ShipmentStatus): Shipment => ({
  id: 's1',
  trackingNumber: 'AB260000001',
  companyId: 'c',
  originBranchId: 'o',
  destBranchId: 'd',
  tripId: null,
  senderName: 'مرسل',
  senderPhone: '0933000000',
  receiverName: 'مستلم',
  receiverPhone: '0944000000',
  goodsType: 'normal',
  weightKg: 5,
  price: 1000,
  codAmount: 0,
  status,
  createdAt: '2026-11-25T00:00:00Z',
});

const renderPage = (): void => {
  render(
    <MemoryRouter initialEntries={['/branch/shipments/AB260000001']}>
      <Routes>
        <Route path="/branch/shipments/:trackingNumber" element={<ShipmentDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

const buttons = (): string[] => screen.queryAllByRole('button').map((b) => b.textContent ?? '');

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ShipmentDetailPage status actions', () => {
  it('offers only the allowed next statuses for a received shipment', async () => {
    getByTracking.mockResolvedValue(shipment('received'));
    renderPage();
    await screen.findByText('تغيير الحالة');
    expect(buttons()).toEqual(expect.arrayContaining(['محمّلة', 'مرتجعة', 'مشكلة']));
    expect(buttons()).not.toContain('في الطريق');
    expect(buttons()).not.toContain('سُلّمت');
  });

  it('does not offer delivery as a plain button; arrived shows the OTP form instead', async () => {
    getByTracking.mockResolvedValue(shipment('arrived'));
    renderPage();
    await screen.findByText('التسليم برمز التحقق');
    expect(buttons()).not.toContain('سُلّمت');
    expect(buttons()).toContain('تسليم');
  });

  it('offers no status action for a delivered shipment', async () => {
    getByTracking.mockResolvedValue(shipment('delivered'));
    renderPage();
    await screen.findByText('سجل الحالات');
    expect(screen.queryByText('تغيير الحالة')).toBeNull();
    expect(screen.queryByText('التسليم برمز التحقق')).toBeNull();
  });
});
