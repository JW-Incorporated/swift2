// The "we'll finish turning off notifications when you're back online" state, derived from the host's persisted
// pending flag (never component-local): re-read on mount, on foreground, and by a slow poll while pending so a
// successful background retry clears the notice. Hosts without the flag (the website) are a permanent no-op.
import { useCallback, useEffect, useState } from 'react';
import type { SettingsDriver } from './driver';

export const OPT_OUT_POLL_MS = 15_000;

export function useOptOutPending(driver: SettingsDriver | null): { pending: boolean; refresh: () => Promise<boolean> } {
  const [pending, setPending] = useState(false);
  const refresh = useCallback(async () => {
    const next = driver?.optOutPending ? await driver.optOutPending() : false;
    setPending(next);
    return next;
  }, [driver]);

  useEffect(() => {
    if (!driver?.optOutPending) return;
    void refresh();
    const onForeground = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onForeground);
    window.addEventListener('focus', onForeground);
    return () => {
      document.removeEventListener('visibilitychange', onForeground);
      window.removeEventListener('focus', onForeground);
    };
  }, [driver, refresh]);

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => void refresh(), OPT_OUT_POLL_MS);
    return () => clearInterval(id);
  }, [pending, refresh]);

  return { pending, refresh };
}
