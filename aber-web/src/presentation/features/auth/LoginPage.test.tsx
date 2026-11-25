import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/domain/entities/User';
import { LoginPage } from './LoginPage';

const loginMock = vi.fn();
vi.mock('@/app/container', () => ({
  authRepository: { login: (...a: unknown[]) => loginMock(...a) },
}));

const { useAuthStore } = await import('@/presentation/stores/authStore');

const fakeUser: User = {
  id: 'u1',
  fullName: 'Test User',
  email: 'test@example.test',
  phone: null,
  role: 'system_admin',
  companyId: null,
  branchId: null,
};

function renderPage(): void {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  afterEach(cleanup);

  beforeEach(() => {
    loginMock.mockReset();
    localStorage.clear();
    useAuthStore.setState({ user: null, loading: false, error: null });
  });

  it('shows Arabic validation errors and does not call the API', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));
    expect(await screen.findByText('أدخل البريد الإلكتروني أو رقم الهاتف')).toBeTruthy();
    expect(screen.getByText('أدخل كلمة المرور')).toBeTruthy();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('logs in, stores the token and goes to the dashboard', async () => {
    loginMock.mockResolvedValue({ token: 'random-token', user: fakeUser });
    renderPage();
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني أو رقم الهاتف'), {
      target: { value: 'test@example.test' },
    });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));
    expect(await screen.findByText('dashboard')).toBeTruthy();
    expect(localStorage.getItem('aber-token')).toBe('random-token');
    expect(useAuthStore.getState().user?.id).toBe('u1');
  });

  it('shows the server error message when login fails', async () => {
    loginMock.mockRejectedValue(new Error('بيانات الدخول غير صحيحة'));
    renderPage();
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني أو رقم الهاتف'), {
      target: { value: 'test@example.test' },
    });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('بيانات الدخول غير صحيحة'),
    );
    expect(localStorage.getItem('aber-token')).toBeNull();
  });
});
