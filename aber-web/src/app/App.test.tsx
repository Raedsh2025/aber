import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';

describe('App', () => {
  it('shows the Arabic welcome heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'مرحبًا بك في عابر' })).toBeTruthy();
  });
});
