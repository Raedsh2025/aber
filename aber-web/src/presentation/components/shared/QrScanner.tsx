import { useEffect, useId, type JSX } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCAN_FPS = 10;
const SCAN_BOX_PX = 240;

interface QrScannerProps {
  /** Pass a stable function (useCallback) so the camera is not restarted. */
  onScan: (text: string) => void;
}

// The camera only works on HTTPS or localhost (browser rule).
export function QrScanner({ onScan }: QrScannerProps): JSX.Element {
  const elementId = useId().replace(/:/g, '');

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId);
    let cancelled = false;
    let started = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: SCAN_FPS, qrbox: SCAN_BOX_PX },
        onScan,
        () => undefined,
      )
      .then(() => {
        started = true;
        if (cancelled) void scanner.stop().then(() => scanner.clear());
      })
      .catch(() => undefined); // Permission denied or no camera: the manual input still works.

    return () => {
      cancelled = true;
      if (started) void scanner.stop().then(() => scanner.clear());
    };
  }, [elementId, onScan]);

  return (
    <div
      id={elementId}
      className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border-2 border-gold-500/60 bg-navy-900/5"
    />
  );
}
