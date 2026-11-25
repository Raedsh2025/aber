import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/domain/entities/User';
import { RegisterPage } from './RegisterPage';

const registerMock = vi.fn();
vi.mock('@/app/container', () => ({
  authRepository: { register: (...a: unknown[]) => registerMock(...a) },
}));

const { useAuthStore } = await import('@/presentation/stores/authStore');

const customerUser: User = {
  id: 'c1',
  fullName: 'زبون جديد',
  email: 'new@example.test',
  phone: '911222333',
  role: 'customer',
  companyId: null,
  branchId: null,
};

function renderPage(): void {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/account" element={<p>account</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillValidForm(): void {
  fireEvent.change(screen.getByLabelText('الاسم الكامل'), { target: { value: 'زبون جديد' } });
  fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), {
    target: { value: 'new@example.test' },
  });
  fireEvent.change(screen.getByLabelText('رقم الهاتف'), { target: { value: '0911222333' } });
  fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'password-8' } });
  fireEvent.change(screen.getByLabelText('تأكيد كلمة المرور'), {
    target: { value: 'password-8' },
  });
}

describe('RegisterPage', () => {
  afterEach(cleanup);

  beforeEach(() => {
    registerMock.mockReset();
    localStorage.clear();
    useAuthStore.setState({ user: null, loading: false, error: null });
  });

  it('shows Arabic validation errors and does not call the API', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'إنشاء الحساب' }));
    expect(await screen.findByText('أدخل الاسم الكامل')).toBeTruthy();
    expect(screen.getByText('أدخل البريد الإلكتروني')).toBeTruthy();
    expect(screen.getByText('أدخل رقم الهاتف')).toBeTruthy();
    expect(screen.getByText('كلمة المرور 8 أحرف على الأقل')).toBeTruthy();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords before calling the API', async () => {
    renderPage();
    fillValidForm();
    fireEvent.change(screen.getByLabelText('تأكيد كلمة المرور'), {
      target: { value: 'different-8' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'إنشاء الحساب' }));
    expect(await screen.findByText('كلمتا المرور غير متطابقتين')).toBeTruthy();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('registers, stores the token and lands on the account page', async () => {
    registerMock.mockResolvedValue({ token: 'random-token', user: customerUser });
    renderPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'إنشاء الحساب' }));
    expect(await screen.findByText('account')).toBeTruthy();
    expect(localStorage.getItem('aber-token')).toBe('random-token');
    expect(useAuthStore.getState().user?.role).toBe('customer');
    expect(registerMock).toHaveBeenCalledWith({
      fullName: 'زبون جديد',
      email: 'new@example.test',
      phone: '0911222333',
      password: 'password-8',
    });
  });

  it('shows the server error message when registration fails', async () => {
    registerMock.mockRejectedValue(new Error('هذا البريد مسجل بالفعل'));
    renderPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'إنشاء الحساب' }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('هذا البريد مسجل بالفعل'),
    );
    expect(localStorage.getItem('aber-token')).toBeNull();
  });
});
