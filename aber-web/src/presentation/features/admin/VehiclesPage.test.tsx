import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const listVehicles = vi.fn();
const create = vi.fn();
vi.mock('@/app/container', () => ({
  vehicleRepository: { list: () => listVehicles() },
  createVehicle: (...a: unknown[]) => create(...a),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const { VehiclesPage } = await import('./VehiclesPage');

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('VehiclesPage', () => {
  it('lists vehicles and shows an empty state', async () => {
    listVehicles.mockResolvedValueOnce([
      { id: 'v1', plateNumber: '123456', capacityKg: 1500, isActive: true },
    ]);
    render(<VehiclesPage />);
    expect(await screen.findByText('123456')).toBeTruthy();
    cleanup();
    listVehicles.mockResolvedValueOnce([]);
    render(<VehiclesPage />);
    expect(await screen.findByText('لا توجد مركبات بعد')).toBeTruthy();
  });

  it('validates the form before calling the use case', async () => {
    listVehicles.mockResolvedValue([]);
    render(<VehiclesPage />);
    await screen.findByText('لا توجد مركبات بعد');
    fireEvent.click(screen.getByText('إضافة مركبة'));
    expect(await screen.findByText('أدخل رقم اللوحة')).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a vehicle and reloads the list', async () => {
    listVehicles.mockResolvedValue([]);
    create.mockResolvedValue({});
    render(<VehiclesPage />);
    await screen.findByText('لا توجد مركبات بعد');
    fireEvent.change(screen.getByLabelText('رقم اللوحة'), { target: { value: '777777' } });
    fireEvent.change(screen.getByLabelText('السعة (كغ)'), { target: { value: '2000' } });
    fireEvent.click(screen.getByText('إضافة مركبة'));
    await waitFor(() => expect(create).toHaveBeenCalled());
    await waitFor(() => expect(listVehicles).toHaveBeenCalledTimes(2));
  });
});
