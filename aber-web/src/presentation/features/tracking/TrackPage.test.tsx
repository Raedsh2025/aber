import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackPage } from './TrackPage';

const trackPublic = vi.fn();
vi.mock('@/app/container', () => ({
  shipmentRepository: { trackPublic: (...a: unknown[]) => trackPublic(...a) },
}));

const renderPage = (): void => {
  render(
    <MemoryRouter>
      <TrackPage />
    </MemoryRouter>,
  );
};

describe('TrackPage', () => {
  afterEach(cleanup);
  beforeEach(() => {
    trackPublic.mockReset();
  });

  it('shows the status and history for a known tracking number', async () => {
    trackPublic.mockResolvedValue({
      trackingNumber: 'AB260000001',
      status: 'in_transit',
      originGovernorate: 'دمشق',
      destGovernorate: 'حلب',
      history: [{ status: 'received', changedAt: '2026-11-24T10:00:00Z', note: null }],
    });
    renderPage();
    fireEvent.change(screen.getByLabelText('رقم البوليصة'), { target: { value: ' AB260000001 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'تتبّع' }));
    expect(await screen.findByText('في الطريق')).toBeTruthy();
    expect(trackPublic).toHaveBeenCalledWith('AB260000001');
    expect(screen.getByText('سجل الشحنة')).toBeTruthy();
  });

  it('shows the error for an unknown number', async () => {
    trackPublic.mockRejectedValue(new Error('رقم البوليصة غير صحيح'));
    renderPage();
    fireEvent.change(screen.getByLabelText('رقم البوليصة'), { target: { value: 'XX' } });
    fireEvent.click(screen.getByRole('button', { name: 'تتبّع' }));
    expect((await screen.findByRole('alert')).textContent).toContain('رقم البوليصة غير صحيح');
  });
});
