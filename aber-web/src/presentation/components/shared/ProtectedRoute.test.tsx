import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/presentation/stores/authStore';
import { ProtectedRoute } from './ProtectedRoute';

function renderAt(roles?: ('system_admin' | 'customer')[]): void {
  render(
    <MemoryRouter initialEntries={['/p']}>
      <Routes>
        <Route element={<ProtectedRoute roles={roles} />}>
          <Route path="/p" element={<p>secret</p>} />
        </Route>
        <Route path="/login" element={<p>login</p>} />
        <Route path="/403" element={<p>forbidden</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const user = {
  id: '1',
  fullName: 'n',
  email: 'a@b.test',
  role: 'customer' as const,
  companyId: null,
  branchId: null,
};

describe('ProtectedRoute', () => {
  afterEach(cleanup);
  beforeEach(() => useAuthStore.setState({ user: null }));

  it('redirects anonymous users to /login', () => {
    renderAt();
    expect(screen.getByText('login')).toBeTruthy();
  });
  it('redirects wrong role to /403', () => {
    useAuthStore.setState({ user });
    renderAt(['system_admin']);
    expect(screen.getByText('forbidden')).toBeTruthy();
  });
  it('renders content for an allowed role', () => {
    useAuthStore.setState({ user });
    renderAt(['customer']);
    expect(screen.getByText('secret')).toBeTruthy();
  });
});
