import { useEffect } from 'react';
import { setBusy } from '../../bridge/busy-signal';

/** Reports `busy` under `key` for as long as the caller is mounted (cleared on unmount). */
export function useReportBusy(key: string, busy: boolean): void {
  useEffect(() => {
    setBusy(key, busy);
    return () => setBusy(key, false);
  }, [key, busy]);
}
