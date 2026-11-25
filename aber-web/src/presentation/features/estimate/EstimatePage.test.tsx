import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const governorates = vi.fn();
const estimate = vi.fn();
vi.mock('@/app/container', async () => {
  const { makeEstimatePrice } = await import('@/application/useCases/estimatePrice');
  const repo = {
    governorates: () => governorates(),
    estimate: (...a: unknown[]) => estimate(...a),
  };
  return { estimateRepository: repo, estimatePrice: makeEstimatePrice(repo) };
});

const { EstimatePage } = await import('./EstimatePage');

const GOVS = [
  { code: 'ALP', nameAr: 'حلب' },
  { code: 'DAM', nameAr: 'دمشق' },
];

const renderPage = (): void => {
  render(
    <MemoryRouter>
      <EstimatePage />
    </MemoryRouter>,
  );
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('EstimatePage', () => {
  it('shows the empty state when no route is priced', async () => {
    governorates.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText('لا توجد مسارات مسعّرة حاليًا')).toBeTruthy();
  });

  it('shows an error with retry when governorates fail to load', async () => {
    governorates.mockRejectedValue(new Error('تعذّر تحميل المحافظات'));
    renderPage();
    expect(await screen.findByText('تعذّر تحميل المحافظات')).toBeTruthy();
    expect(screen.getByText('إعادة المحاولة')).toBeTruthy();
  });

  it('validates the form before calling the API', async () => {
    governorates.mockResolvedValue(GOVS);
    renderPage();
    fireEvent.click(await screen.findByText('احسب السعر'));
    expect(await screen.findByText('اختر محافظة الانطلاق')).toBeTruthy();
    expect(estimate).not.toHaveBeenCalled();
  });

  it('shows the server price and duration', async () => {
    governorates.mockResolvedValue(GOVS);
    estimate.mockResolvedValue({ from: 'ALP', to: 'DAM', price: 31_250, estHours: 6 });
    renderPage();
    await screen.findByText('احسب السعر');
    fireEvent.change(screen.getByLabelText('من محافظة'), { target: { value: 'ALP' } });
    fireEvent.change(screen.getByLabelText('إلى محافظة'), { target: { value: 'DAM' } });
    fireEvent.change(screen.getByLabelText('الوزن (كغ)'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('نوع البضاعة'), { target: { value: 'fragile' } });
    fireEvent.click(screen.getByText('احسب السعر'));
    expect(await screen.findByText('31,250')).toBeTruthy();
    expect(estimate).toHaveBeenCalledWith({
      from: 'ALP',
      to: 'DAM',
      weightKg: 10,
      goodsType: 'fragile',
    });
  });

  it('shows the Arabic error when the route has no price', async () => {
    governorates.mockResolvedValue(GOVS);
    estimate.mockRejectedValue(new Error('لا يوجد سعر معرّف لهذا المسار'));
    renderPage();
    await screen.findByText('احسب السعر');
    fireEvent.change(screen.getByLabelText('من محافظة'), { target: { value: 'DAM' } });
    fireEvent.change(screen.getByLabelText('إلى محافظة'), { target: { value: 'ALP' } });
    fireEvent.change(screen.getByLabelText('الوزن (كغ)'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('احسب السعر'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('لا يوجد سعر'));
  });
});
