import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Trip } from '@/domain/entities/Trip';

const listTrips = vi.fn();
vi.mock('@/app/container', () => ({
  tripRepository: { list: (...a: unknown[]) => listTrips(...a) },
  branchRepository: {
    list: () =>
      Promise.resolve([
        {
          id: 'a',
          name: 'فرع دمشق',
          governorateCode: 'DAM',
          governorateName: 'دمشق',
          address: null,
        },
        { id: 'b', name: 'فرع حلب', governorateCode: 'ALP', governorateName: 'حلب', address: null },
      ]),
  },
}));

const { DriverTripsPage } = await import('./DriverTripsPage');

const trip: Trip = {
  id: 't1',
  companyId: 'c',
  fromBranchId: 'a',
  toBranchId: 'b',
  driverId: 'd',
  vehicleId: null,
  departureAt: '2026-11-25T08:00:00Z',
  estimatedArrivalAt: null,
  capacityKg: 1000,
  status: 'loading',
  loadedKg: 250,
  freeKg: 750,
  shipmentsCount: 3,
};

const renderPage = (): void => {
  render(
    <MemoryRouter>
      <DriverTripsPage />
    </MemoryRouter>,
  );
};

describe('DriverTripsPage', () => {
  afterEach(() => {
    cleanup();
    listTrips.mockReset();
  });

  it('shows the assigned trips with branch names and status', async () => {
    listTrips.mockResolvedValue([trip]);
    renderPage();
    expect(await screen.findByText('قيد التحميل')).toBeTruthy();
    expect(await screen.findByText(/فرع دمشق/)).toBeTruthy();
  });

  it('shows an empty state when no trip is assigned', async () => {
    listTrips.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText('لا توجد رحلات مسندة إليك')).toBeTruthy();
  });

  it('shows an error with retry when loading fails', async () => {
    listTrips.mockRejectedValue(new Error('تعذّر تحميل الرحلات'));
    renderPage();
    expect(await screen.findByText('تعذّر تحميل الرحلات')).toBeTruthy();
    expect(screen.getByText('إعادة المحاولة')).toBeTruthy();
  });
});
