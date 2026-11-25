import { Printer } from 'lucide-react';
import type { JSX } from 'react';
import { Button } from './Button';

/** Opens the browser print dialog. "Save as PDF" is a destination in that dialog. */
export function PrintButton(): JSX.Element {
  return (
    <Button variant="secondary" className="no-print" onClick={() => window.print()}>
      <Printer aria-hidden="true" className="me-2 h-4 w-4" />
      طباعة / حفظ PDF
    </Button>
  );
}
