import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrintButton } from './PrintButton';

afterEach(cleanup);

describe('PrintButton', () => {
  it('opens the browser print dialog and is hidden when printing', () => {
    const print = vi.fn();
    vi.stubGlobal('print', print);
    render(<PrintButton />);
    const button = screen.getByRole('button', { name: 'طباعة / حفظ PDF' });
    expect(button.className).toContain('no-print');
    fireEvent.click(button);
    expect(print).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
